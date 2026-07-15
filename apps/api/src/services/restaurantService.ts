import { Restaurant, IRestaurant } from '../models/Restaurant.js';
import { Group } from '../models/Group.js';
import { Types } from 'mongoose';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';

// Utilidad para evitar errores si el usuario usa caracteres especiales en el nombre (Ej: paréntesis, asteriscos)
const escapeRegex = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

export const restaurantService = {
  /**
   * Crea un restaurante dentro de un grupo e incluye la primera reseña si se proporciona.
   * Detecta similitudes si no se envía forceCreate = true.
   */
  async createRestaurant(
    name: string, 
    mapsLink: string, // <-- Vuelve a ser obligatorio
    categoryId: string, 
    groupId: string,
    creatorId?: string,
    initialComment?: string,
    forceCreate?: boolean
  ) { 
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) throw new Error('La categoria especificada no existe');

    const groupExists = await Group.findById(groupId);
    if (!groupExists) throw new Error('El grupo especificado no existe');

    // --- LÓGICA DE SIMILITUDES (Segura) ---
    if (!forceCreate) {
      const safeRegexName = escapeRegex(name);
      const similarPlaces = await Restaurant.find({
        groupId,
        name: { $regex: safeRegexName, $options: 'i' } // Búsqueda segura e insensible a mayúsculas/minúsculas
      });

      if (similarPlaces.length > 0) {
        return {
          status: 'WARNING_SIMILAR',
          message: 'Hay lugares con nombres similares en este grupo',
          similarPlaces
        };
      }
    }
    // -----------------------------------

    const memberReviews = [];

    // Si el creador deja un comentario inicial, buscamos su nombre para la reseña
    if (creatorId && initialComment) {
      const user = await User.findById(creatorId);
      if (user) {
        memberReviews.push({
          userId: user._id as any,
          username: user.username,
          comment: initialComment,
          createdAt: new Date()
        });
      }
    }

    const newRestaurant = new Restaurant({
      name,
      mapsLink, // Se guarda directamente, ya que es obligatorio
      categoryId,
      groupId,
      memberReviews,
      votes: [] // Inicializamos explícitamente los votos
    });

    const savedRestaurant = await newRestaurant.save();
    return { status: 'CREATED', data: savedRestaurant };
  },

  /**
   * Obtiene los restaurantes pertenecientes a un grupo ordenados por votos.
   */
  async getRestaurantsByGroup(groupId: string): Promise<IRestaurant[]> {
    // Usamos el aggregate de MongoDB para poder ordenar por el tamaño del array 'votes'
    return await Restaurant.aggregate([
      { $match: { groupId: new Types.ObjectId(groupId) } }, // Filtramos por grupo
      { 
        $addFields: { 
          votesCount: { $size: { $ifNull: ["$votes", []] } } // Contamos los votos
        } 
      },
      { $sort: { votesCount: -1 } }, // Ordenamos: -1 es descendente (más votos primero)
      {
        $lookup: { // Esto reemplaza al .populate()
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryId' 
        }
      },
      { $unwind: "$categoryId" } // Devolvemos la categoría a un objeto simple
    ]);
  },

  /**
   * Añade la reseña de un miembro al arreglo interno del restaurante.
   */
  async addReviewToRestaurant(restaurantId: string, userId: string, comment: string): Promise<IRestaurant | null> {
    const user = await User.findById(userId);
    if (!user) throw new Error('El usuario no existe');

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw new Error('El restaurante no existe');

    // Evitamos que el mismo usuario deje dos reseñas en la misma sucursal
    const alreadyReviewed = restaurant.memberReviews.some(
      (r) => r.userId.toString() === userId.toString()
    );

    if (alreadyReviewed) {
      throw new Error('Ya comentaste en esta sucursal');
    }

    const newReview = {
      userId: user._id as any,
      username: user.username,
      comment,
      createdAt: new Date()
    };

    // Usamos el restaurante que ya buscamos para agregar la reseña y guardar
    restaurant.memberReviews.push(newReview as any);
    return await restaurant.save();
  },

  /**
   * Agrega o quita el voto de un usuario en un restaurante
   */
  async toggleVote(restaurantId: string, userId: string) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurante no encontrado');
    }

    // Por seguridad, aseguramos que el arreglo exista
    if (!restaurant.votes) {
      restaurant.votes = [];
    }

    // Comprobamos si el usuario ya votó
    const hasVoted = restaurant.votes.some(id => id.toString() === userId.toString());

    if (hasVoted) {
      // Si ya votó, filtramos el arreglo para quitar su ID
      restaurant.votes = restaurant.votes.filter(id => id.toString() !== userId.toString());
    } else {
      // Si no ha votado, lo añadimos
      restaurant.votes.push(userId as any);
    }

    await restaurant.save();
    return restaurant;
  }
};
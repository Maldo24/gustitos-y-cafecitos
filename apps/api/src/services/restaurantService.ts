import { Restaurant, IRestaurant, IMemberReview } from '../models/Restaurant.js'; // <-- 1. Importamos IMemberReview
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
    mapsLink: string, 
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
        name: { $regex: safeRegexName, $options: 'i' } 
      });

      if (similarPlaces.length > 0) {
        return {
          status: 'WARNING_SIMILAR',
          message: 'Hay lugares con nombres similares en este grupo',
          similarPlaces
        };
      }
    }
    // Tipamos el arreglo para que TypeScript sepa qué va a recibir
    const memberReviews: IMemberReview[] = []; 

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
      mapsLink, 
      categoryId,
      groupId,
      memberReviews,
      votes: [] 
    });

    const savedRestaurant = await newRestaurant.save();
    return { status: 'CREATED', data: savedRestaurant };
  },

  /**
   * Obtiene los restaurantes pertenecientes a un grupo ordenados por votos.
   */
  async getRestaurantsByGroup(groupId: string): Promise<IRestaurant[]> {
    return await Restaurant.aggregate([
      { $match: { groupId: new Types.ObjectId(groupId) } }, 
      { 
        $addFields: { 
          votesCount: { $size: { $ifNull: ["$votes", []] } } 
        } 
      },
      { $sort: { votesCount: -1 } }, 
      {
        $lookup: { 
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryId' 
        }
      },
      { $unwind: "$categoryId" } 
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

    const alreadyReviewed = restaurant.memberReviews.some(
      (r) => r.userId.toString() === userId.toString()
    );

    if (alreadyReviewed) {
      throw new Error('Ya comentaste en esta sucursal');
    }

    //  Tipamos la nueva reseña con la interfaz correcta
    const newReview: IMemberReview = {
      userId: user._id as any,
      username: user.username,
      comment,
      createdAt: new Date()
    };

    //  Aseguramos el cast en el push para evitar advertencias de Mongoose
    (restaurant.memberReviews as IMemberReview[]).push(newReview);
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

    if (!restaurant.votes) {
      restaurant.votes = [];
    }

    const hasVoted = restaurant.votes.some(id => id.toString() === userId.toString());

    if (hasVoted) {
      restaurant.votes = restaurant.votes.filter(id => id.toString() !== userId.toString());
    } else {
      restaurant.votes.push(userId as any);
    }

    await restaurant.save();
    return restaurant;
  }
};
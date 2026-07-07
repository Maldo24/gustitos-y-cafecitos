import { Restaurant, IRestaurant } from '../models/Restaurant.js';
import { Group } from '../models/Group.js';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';

export const restaurantService = {
  /**
   * Crea un restaurante dentro de un grupo e incluye la primera reseña si se proporciona.
   */
  async createRestaurant(
    name: string, 
    mapsLink: string, 
    categoryId: string, 
    groupId: string,
    creatorId?: string,
    initialComment?: string
  ): Promise<IRestaurant> {
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) throw new Error('La categoria especificada no existe');

    const groupExists = await Group.findById(groupId);
    if (!groupExists) throw new Error('El grupo especificado no existe');

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
      mapsLink,
      categoryId,
      groupId,
      memberReviews
    });

    return await newRestaurant.save();
  },

  /**
   * Obtiene los restaurantes pertenecientes a un grupo.
   */
  async getRestaurantsByGroup(groupId: string): Promise<IRestaurant[]> {
    return await Restaurant.find({ groupId }).populate('categoryId', 'name slug');
  },

  /**
   * Añade la reseña de un miembro al arreglo interno del restaurante.
   */
  async addReviewToRestaurant(restaurantId: string, userId: string, comment: string): Promise<IRestaurant | null> {
    const user = await User.findById(userId);
    if (!user) throw new Error('El usuario no existe');

    const newReview = {
      userId: user._id as any,
      username: user.username,
      comment,
      createdAt: new Date()
    };

    // Usamos $push para insertar el objeto directamente en el array memberReviews
    return await Restaurant.findByIdAndUpdate(
      restaurantId,
      { $push: { memberReviews: newReview } },
      { new: true } // Retorna el documento actualizado
    );
  }
};
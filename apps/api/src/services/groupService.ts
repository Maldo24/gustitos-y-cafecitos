import {Group, IGroup} from "../models/Group";
import {User} from  "../models/User";
import { Restaurant } from "../models/Restaurant";
import crypto from "crypto";

export const groupService = {
    // aca lo que vamos a generar es un id o slug para la parte final de los enlaces
    // asi son unicos

    async createGroup(name: string, creatorId?: string): Promise<IGroup>{
        const baseSlug = name
        .toLocaleLowerCase()
        .trim()
        .normalize()
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-');

        const uniqueSuffix = crypto.randomBytes(2).toString("hex");
        const slug = `${baseSlug}-${uniqueSuffix}`;

        const members: string[] = [];
        if (creatorId){
            const userExists = await User.findById(creatorId);
            if(!userExists){
                throw new Error("el usuario creador no existe");
            }
            members.push(creatorId);
        }

        const newGroup = new Group({
            name, 
            slug, 
            members
        });

        return await newGroup.save();
    },
    

    //funcion para buscar grupos por su slug

    async getGroupBySlug(slug:string): Promise <IGroup | null>{
        return await Group.findOne({slug})
        .populate("members", "username email")
        .populate({
            path: "savedRestaurants",
            populate : {path: "categoryId", select: "name slug"}
        });
    },
    async addRestaurantToGroup(groupSlug: string, restaurantId: string): Promise<IGroup> {
        const restaurantExists = await Restaurant.findById(restaurantId);
        if (!restaurantExists) {
            throw new Error('El restaurante a añadir no existe');
        }

        const group = await Group.findOne({ slug: groupSlug });
        if (!group) {
            throw new Error('El grupo especificado no existe');
        }

        // Evitar duplicados en el array de restaurantes guardados
        if (group.savedRestaurants.includes(restaurantExists._id as any)) {
            throw new Error('El restaurante ya se encuentra sugerido en este grupo');
        }

        group.savedRestaurants.push(restaurantExists._id as any);
        return await group.save();
    }

}

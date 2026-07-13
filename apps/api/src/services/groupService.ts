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
    },

    //funcion para añadir miembros a los grupos
    async addMemberToGroup(groupId: string, username: string) {
        // 1. Buscamos al amigo
        const userToAdd = await User.findOne({ username });
        if (!userToAdd) {
            throw new Error('No encontramos a ningún usuario con ese username');
        }

        // 2. Buscamos el grupo
        const group = await Group.findById(groupId);
        if (!group) {
            throw new Error('El grupo no existe');
        }

        // 3. Verificamos que no esté ya dentro (convertimos a string para comparar bien)
        const isAlreadyMember = group.members.some(
        (memberId) => memberId.toString() === userToAdd._id.toString()
        );
        
        if (isAlreadyMember) {
            throw new Error('Tu amigo ya está en este grupo');
        }

        // 4. Lo agregamos y guardamos
        group.members.push(userToAdd._id);
        await group.save();
        
        return group;
    }, 
    // Buscamos todos los grupos donde el array 'members' contenga el ID del usuario
    async getGroupsByUser(userId: string) {
        const groups = await Group.find({ members: userId })
        .populate('members', 'username names firstSurname') // Traemos info útil de los amigos
        .sort({ createdAt: -1 }); // Los más recientes primero
        
        return groups;
    },
    async getGroupMembers(groupId: string) {
        // Buscamos el grupo y rellenamos la información de los miembros
        const group = await Group.findById(groupId)
        .populate('members', 'username names firstSurname email'); 
        
        if (!group) {
        throw new Error('Grupo no encontrado');
        }

        // Devolvemos directamente el arreglo de miembros
        return group.members;
    }

}

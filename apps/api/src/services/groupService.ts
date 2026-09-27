import {Group, IGroup} from "../models/Group";
import {User} from  "../models/User";
import { Restaurant } from "../models/Restaurant";
import crypto from "crypto";

function isGroupAdmin(group: IGroup | null, userId: string): boolean {
    if (!group || !group.adminId) return false;
    return group.adminId.toString() === userId.toString();
}

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
            members,
            adminId: creatorId || null
        });

        return await newGroup.save();
    },

    // Asegura que todo grupo tenga un admin. Para grupos viejos sin adminId,
    // el primer miembro (quien lo creó) pasa a ser el admin automáticamente.
    async ensureGroupAdmin(group: IGroup | null): Promise<IGroup | null> {
        if (!group) return null;
        if (!group.adminId && group.members.length > 0) {
            group.adminId = group.members[0];
            await group.save();
        }
        return group;
    },
    
    //funcion para buscar grupos por su slug

    async getGroupBySlug(slug:string): Promise <IGroup | null>{
        const group = await Group.findOne({slug})
        .populate("members", "username email")
        .populate({
            path: "savedRestaurants",
            populate : {path: "categoryId", select: "name slug"}
        });

        return await this.ensureGroupAdmin(group);
    },

    // Expulsa a un miembro del grupo (solo el admin del grupo)
    async removeMemberFromGroup(groupId: string, adminId: string, memberId: string): Promise<IGroup> {
        const group = await Group.findById(groupId);
        if (!group) {
            throw new Error('El grupo no existe');
        }

        if (!isGroupAdmin(group, adminId)) {
            throw new Error('Solo el administrador del grupo puede expulsar miembros');
        }

        if (memberId.toString() === adminId.toString()) {
            throw new Error('El administrador no puede expulsarse a sí mismo');
        }

        if (group.adminId && memberId.toString() === group.adminId.toString()) {
            throw new Error('No puedes expulsar al administrador del grupo');
        }

        const wasMember = group.members.some(
            (id) => id.toString() === memberId.toString()
        );

        if (!wasMember) {
            throw new Error('Ese usuario no es miembro del grupo');
        }

        group.members = group.members.filter(
            (id) => id.toString() !== memberId.toString()
        );

        return await group.save();
    },

    // Elimina una recomendación (restaurante) del grupo (solo el admin)
    async removeRestaurantFromGroup(groupId: string, adminId: string, restaurantId: string): Promise<IGroup> {
        const group = await Group.findById(groupId);
        if (!group) {
            throw new Error('El grupo no existe');
        }

        if (!isGroupAdmin(group, adminId)) {
            throw new Error('Solo el administrador del grupo puede eliminar recomendaciones');
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || restaurant.groupId.toString() !== groupId.toString()) {
            throw new Error('La recomendación no pertenece a este grupo');
        }

        const wasSaved = group.savedRestaurants.some(
            (id) => id.toString() === restaurantId.toString()
        );

        if (wasSaved) {
            group.savedRestaurants = group.savedRestaurants.filter(
                (id) => id.toString() !== restaurantId.toString()
            );
        }

        await Restaurant.findByIdAndDelete(restaurantId);
        await group.save();
        return group;
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
    // Agregamos el usuario actual al grupo (unirse)
    async joinGroup(groupId: string, userId: string): Promise<IGroup> {
        const userExists = await User.findById(userId);
        if (!userExists) {
            throw new Error('El usuario no existe');
        }

        const group = await Group.findById(groupId);
        if (!group) {
            throw new Error('El grupo no existe');
        }

        const isAlreadyMember = group.members.some(
            (memberId) => memberId.toString() === userId.toString()
        );

        if (isAlreadyMember) {
            throw new Error('Ya eres miembro de este grupo');
        }

        group.members.push(userExists._id);
        return await group.save();
    },

    // Buscamos todos los grupos donde el array 'members' contenga el ID del usuario
    async getGroupsByUser(userId: string) {
        const groups = await Group.find({ members: userId })
        .populate('members', 'username names firstSurname') // Traemos info útil de los amigos
        .sort({ createdAt: -1 }); // Los más recientes primero
        
        // Backfill de admin para grupos antiguos sin adminId
        await Promise.all(groups.map((g) => this.ensureGroupAdmin(g)));

        return await Group.find({ members: userId })
        .populate('members', 'username names firstSurname')
        .sort({ createdAt: -1 });
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
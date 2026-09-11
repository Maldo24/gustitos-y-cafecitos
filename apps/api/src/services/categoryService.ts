import { Category, ICategory } from "../models/Category"

export const DEFAULT_CATEGORIES = [
    'Desayuno',
    'Café',
    'Almuerzo',
    'Cena',
    'Comida Rápida',
    'Postres',
    'Bebidas',
    'Mexicana',
    'Pizza',
    'Sushi',
    'Parrilla',
    'Saludable'
];

export const categoryService ={
    async createCategory(name: string): Promise<ICategory> {
        const cleanName = name
            .trim()
            .replace(/\s+/g, ' ')
            .toLocaleLowerCase()
            .replace(/(^|\s)(\p{L})/gu, (_, p1, p2) => p1 + p2.toLocaleUpperCase());

        const slug = cleanName
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
            .replace(/[^a-z0-9 ]/g, '')     // Elimina caracteres especiales
            .replace(/\s+/g, '-');           // Reemplaza espacios por guiones

        // Verificar si ya existe una categoria con ese mismo slug
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            throw new Error(`La categoria '${existingCategory.name}' ya existe`);
        }

        const newCategory = new Category({ name: cleanName, slug });
        return await newCategory.save();
    },

    async seedDefaultCategories(): Promise<void> {
        for (const name of DEFAULT_CATEGORIES) {
            const exists = await Category.findOne({ name });
            if (!exists) {
                try {
                    await categoryService.createCategory(name);
                } catch {
                    // Si el slug ya existe por una variante, lo ignoramos
                }
            }
        }
    },

    //de aca sacamos todas las categorias
    // ver de mejorar la forma de generar los slugs
    async getAllCategories(): Promise <ICategory []>{
        return await Category.find()
    }
};
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

export function normalizeCategoryName(name: string): string {
    return name
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase()
        .replace(/(^|\s)(\p{L})/gu, (_, p1, p2) => p1 + p2.toLocaleUpperCase());
}

export function categorySlug(cleanName: string): string {
    return cleanName
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
        .replace(/[^a-z0-9 ]/g, '')     // Elimina caracteres especiales
        .replace(/\s+/g, '-');           // Reemplaza espacios por guiones
}

export const categoryService ={
    async createCategory(name: string): Promise<ICategory> {
        const cleanName = normalizeCategoryName(name);
        const slug = categorySlug(cleanName);

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

    async updateCategory(id: string, name: string): Promise<ICategory | null> {
        const category = await Category.findById(id);
        if (!category) {
            throw new Error('La categoria no existe');
        }

        const cleanName = normalizeCategoryName(name);
        const slug = categorySlug(cleanName);

        const existingCategory = await Category.findOne({ slug, _id: { $ne: id } });
        if (existingCategory) {
            throw new Error(`Ya existe una categoria '${existingCategory.name}' con el mismo nombre`);
        }

        category.name = cleanName;
        category.slug = slug;
        return await category.save();
    },

    async deleteCategory(id: string): Promise<void> {
        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            throw new Error('La categoria no existe');
        }
    },

    //de aca sacamos todas las categorias
    // ver de mejorar la forma de generar los slugs
    async getAllCategories(): Promise <ICategory []>{
        return await Category.find()
    }
};
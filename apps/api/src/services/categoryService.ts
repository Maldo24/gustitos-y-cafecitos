import { Category, ICategory} from "../models/Category"

export const categoryService ={
    async createCategory(name:string):Promise <ICategory>{
        const slug = name
        .toLocaleLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
        .replace(/[^a-z0-9 ]/g, '')     // Elimina caracteres especiales
        .replace(/\s+/g, '-');           // Reemplaza espacios por guiones

        // Verificar si ya existe una categoria con ese mismo slug
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            throw new Error('La categoria ya existe');
        }

        const newCategory = new Category({ name, slug });
        return await newCategory.save();
    },

    //de aca sacamos todas las categorias
    // ver de mejorar la forma de generar los slugs
    async getAllCategories(): Promise <ICategory []>{
        return await Category.find()
    }
};
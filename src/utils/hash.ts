import bcrypt from "bcryptjs";

 export const HashPassword =async  (password : string)=>{

    return await bcrypt.hash(password , 10)

}

export const ComparePassword = async (password : string , hashedPassword :string) : Promise<boolean>=>{
    
    return await bcrypt.compare(password , hashedPassword)
}


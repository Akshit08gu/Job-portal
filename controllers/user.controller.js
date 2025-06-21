import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"


export const register = async(req,res) => {

    try {
        const {fullname, email, phoneNumber, password, role} = req.body;
        if(!fullname || !email || !phoneNumber || !password || !role){
            return res.status(400).json({
                message: 'something is missing',
                success: false
            });
        };

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                message: 'User already exist with this email',
                success: false,
            })
        }

        const hashedPassword = await bcrypt.hash(password,10);
        
        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
        });

        return res.status(201).json({
            message: 'Account created successfully.',
            success:true
        })
        
    } catch (error) {
        console.log(error);      
    }
}

export const login = async(req,res) => {

    try {
        const {email,password,role} = req.body;
        if(!email || !password || !role){
            return res.status(400).json({
                message: 'something is missing',
                success: false
            });
        };

        let existingUser = await User.findOne({email});
        if(!existingUser){
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        }

        const isPasswordMatch = await bcrypt.compare(password,existingUser.password);

        if(!isPasswordMatch){
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        };

        //check role is correct or not

        if(role !== existingUser.role){
            return res.status(400).json({
                message: "Account does not exist with correct role.",
                success: false
            })
        }

        // RECOMMENDED: Check if process.env.SECRET_KEY exists
        if (!process.env.SECRET_KEY) {
            return res.status(500).json({
                message: "Server configuration error.",
                success: false
            });
        }

        const tokenData = {
            userId: existingUser._id
        }

        const token = await jwt.sign(tokenData, process.env.SECRET_KEY,{expiresIn: '1d'});

        existingUser = {
            _id: existingUser._id,
            fullname: existingUser.fullname,
            email: existingUser.email,
            phoneNumber: existingUser.phoneNumber,
            role: existingUser.role,
            profile: existingUser.profile
        }

        return res.status(200).cookie("token",token,{maxAge: 1*24*60*60*1000 , httpOnly: true, sameSite:'strict'}).json({
            message: `Welcome back ${existingUser.fullname}`,
            existingUser,
            success: true,            
        })

    } catch (error) {
        console.log(error);
    }
}

export const logout = async (req,res) => {

    try {
        return res.status(200).cookie("token","",{maxAge:0}).json({
            message: "Logged out successfully.",
            success: true
        })
        
    } catch (error) {
        console.log(error);    
    }
}

export const updateProfile = async(req,res) => {
    try {
        const {fullname , email, phoneNumber, bio, skills} = req.body;
        const file = req.file;
        // if(!fullname || !email || !phoneNumber || !bio || !skills){
        //     return res.status(400).json({
        //         message: 'something is missing',
        //         success: false
        //     });
        // };

        //cloudinary will come here

        let skillsArray;
        if(skills){
            skillsArray = skills.split(","); 
        }
        
        const userId = req.id; //middleware authentication
        let existingUser = await User.findById(userId);

        if(!existingUser){
            return res.status(400).json({
                message: "User not found.",
                success: false
            })
        }
        
        //updating data
        if(fullname) existingUser.fullname=fullname
        if(email) existingUser.email=email
        if(phoneNumber) existingUser.phoneNumber = phoneNumber
        if(bio) existingUser.profile.bio = bio
        if(skills) existingUser.profile.skills = skillsArray
        
        //resume comes later here;

        await existingUser.save();

        existingUser = {
            _id: existingUser._id,
            fullname:existingUser.fullname,
            email:existingUser.email,
            phoneNumber:existingUser.phoneNumber,
            role:existingUser.role,
            profile:existingUser.profile
        }

        return res.status(200).json({
            message:"Profile updated successfully.",
            existingUser,
            success:true
        })


    } catch (error) {
        console.log(error);
    }
    
}
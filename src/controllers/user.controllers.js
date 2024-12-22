import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from  "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshTokens =async(userId)=>
{
    try{
        const user= await User.findById(userId)
        const accessToken= await user.generateAccessToken()
        const refreshToken= await user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken,refreshToken}

    }
    catch (error)
    {
        throw new ApiError(500,"something went wrong while generating refresh token and access token")
    }
}

const registerUser = asyncHandler( async (req,res)=>{
    //get user details from frontend
    //validation - not empty
    //check if user already exists (from username and email)
    //check for the images, check for avatar
    //upload them to cloudinary, avatar
    //create user object (for the mongodb)- for create entry in db
    //remove password and refresh taken field from response
    //check for the user creation
    //return res




    const {fullName, email, username, password }=req.body
    console.log("email:",email);

    // if(fullName=="")
    // {
    //     throw new ApiError(400,"fullname is required")
    // }

    if(
        [fullName,email,username,password].some((field)=>
            field?.trim()=="")//to check whether any of these field is empty it will return an error
    ){
        throw new ApiError(400,"All fields are required")//validation
    }

    const existedUser= await User.findOne({
        $or:[{ username },{ email }]
    })
    if (existedUser)
    {
        throw new ApiError(409,"user already existed")
    }

    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverIamgeLocalPath= req.files?.coverIamge[0]?.path;

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage =await uploadOnCloudinary(coverIamgeLocalPath)

    if(!avatar)
    {
        throw new ApiError(400,"avatar file is required")
    }

    const user= await User.create({
        fullName,
        avatar: avatar.url,
        coverIamge: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser)
    {
        throw new ApiError (500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered sucessfully")
    )

    })

    const loginUser =asyncHandler(async (req,res)=>{
        //req body ->data
        //username or email
        //find the user
        //check password
        //access and refresh token
        //send the secure cookies and a resonse that it is success



        const {email, username, password}= req.body
        if(!username || !email)
        {
            throw new ApiError(400,"username or email is required")
        }
        const user= await User.findOne({
            $or:[{email},{username}]
        })
        if(!user)
        {
            throw new AppiError(400,"User doesnt exist")
        }

        const isPasswordValid= await user.isPasswordCorrect(password)

        if(!isPasswordValid)
            {
                throw new AppiError(401,"Password incorrect")
            }

        const {accessToken,refreshToken} =await generateAccessAndRefreshTokens(user._id)

        const loggedInUser =await User.findById(user._id).select("-password -refreshToken")

        const options= {
            httpOnly: true,
            secure:true
        }

    
    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken, refreshToken
            },
            "User logged in sucessfully"
        )
    )
})




export  {
    registerUser,
    loginUser
}




const express = require("express");
const router = express.Router();
const { z } = require("zod");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { User, Account } = require("../db");
const { authMiddleware } = require("./middleware");
// import { z } from "zod";

// Signup route

const signUpbody = z.object({
  username: z.string().email(),
  password: z.string(),
  firstname: z.string(),
  lastname: z.string(),
});
router.post("/signup", async (req, res) => {
  const { success, error } = signUpbody.safeParse(req.body);
  console.log(req.body);
  if (!success) {
    console.log(error);
    return res.status(411).json({
      msg: "incorrect inputs",
    });
  }

  const existingUser = await User.findOne({
    username: req.body.username,
  });
  if (existingUser) {
    return res.status(411).json({
      msg: "email alredy exist",
    });
  }

  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
  });

  const userId = user._id;

  //creating acc with random balance

  await Account.create({
    userId,
    balance: Math.round(Math.random() * 10000000000),
  });

  const token = jwt.sign(
    {
      userId,
    },
    JWT_SECRET
  );

  res.status(200).json({
    msg: "user created sucessfully",
    token: token,
  });
});

// Signin route

router.post("/signin", async (req, res) => {
  const existingUser = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });
  if (!existingUser) {
    return res.status(411).json({
      msg: "incorrect inputs",
    });
  }
  const userId = existingUser._id;
  const token = jwt.sign(
    {
      userId,
    },
    JWT_SECRET
  );

  res.status(200).json({
    msg: "logged in sucessfully",
    token: token,
  });
});

//Update route

const updateBody = z.object({
  password: z.string().optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
});
router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    res.status(400).json({
      msg: "incorret inputs",
    });
  }

  await User.updateOne(req.body, {
    _id: req.userId,
  });

  res.status(200).json("updated sucessfully");
});

//get user route

router.get("/bulk", authMiddleware, async (req, res) => {
  const query = req.query.filter || " ";
  const users = await User.find({
    $or: [
      {
        firstname: {
          $regex: query,
        },
      },
      {
        lastname: {
          $regex: query,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => {
      ({
        username: users.username,
        firstname: users.firstname,
        lastname: users.lastname,
        _id: users._id,
      });
    }),
  });
});

module.exports = router;

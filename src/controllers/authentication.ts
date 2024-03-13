import express from 'express';

import { getUserByEmail, createUser, getUserById } from '../db/users';
import { random, authentication } from '../helpers';

export const login = async (req: express.Request, res: express.Response) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.sendStatus(400);
        }

        const user = await getUserByEmail(email).select('+authentication.salt +authentication.password');

        if (!user) {
            return res.status(400).json({message: "problem with getting the user"});
        }

        const userId = user._id.toString()
        const adminId = (await getUserById("65e54669ef073ff3e093a2b2"))._id.toString();

        const expectedHash = authentication(user.authentication.salt, password);

        if (user.authentication.password !== expectedHash){
            return res.status(403).json({message: "invalid email or password"});
        }

        const salt = random();
        user.authentication.sessionToken = authentication(salt, user._id.toString());

        await user.save();

        res.cookie('AD-AUTH', user.authentication.sessionToken, {domain: 'localhost', path: '/'});
        if (userId === adminId){
            res.redirect('/admin');
        }
        else{
        res.redirect(`/home/${userId}`);}

    } catch (error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

export const register = async (req: express.Request, res: express.Response) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const username = req.body.username;

        if (!email || !password || !username){
            return res.sendStatus(400);
        }

        const existingUser = await getUserByEmail(email);

        if (existingUser) {
            return res.sendStatus(400)
        }

        const salt = random();
        const user = await createUser({
            email,
            username,
            authentication: {
                salt,
                password: authentication(salt, password),
            }
        });


        res.redirect(`/login`);
    } catch (error) {
        console.log(error);
        return res.sendStatus(400);
    }
}

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { makeANiceEmail, trasport } = require('../mail');
const { hasPermission } = require('../utils');

const Mutations = {
    async createItem(parent, args, ctx, info) {
        if (!ctx.request.userId) {
            throw new Error('You must be logged in to create an Item!');
        }

        const item = await ctx.db.mutation.createItem({
            data: {
                user: {
                    connect: {
                        id: ctx.request.userId,
                    },
                },
                ...args,
            },
            info,
        });

        return item;
    },
    updateItem(parent, args, ctx, info) {
        const updates = { ...args };
        delete updates.id;

        return ctx.db.mutation.updateItem(
            {
                where: {
                    id: args.id,
                },
                data: updates,
            },
            info
        );
    },
    async deleteItem(parent, args, ctx, info) {
        const where = { id: args.id };
        const item = await ctx.db.query.item({ where }, `{id title user {id}}`);

        const ownsItem = item.user.id === ctx.request.userId;
        const hasPermission = ctx.request.user.permissions.some((per) => ['ADMIN', 'ITEMDELETE'].includes(per));

        if (!ownsItem && !hasPermission) {
            throw new Error("You don't have permission to do that!");
        }

        return ctx.db.mutation.deleteItem({ where }, info);
    },
    async signUp(parent, args, ctx, info) {
        args.email = args.email.toLowerCase();
        const password = await bcrypt.hash(args.password, 10);
        const user = await ctx.db.mutation.createUser(
            {
                data: {
                    ...args,
                    password,
                    permissions: { set: ['USER'] },
                },
            },
            info
        );

        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });

        return user;
    },
    async signIn(parent, { email, password }, ctx, info) {
        const user = await ctx.db.query.user({ where: { email: email } });

        if (!user) {
            throw new Error(`No such user found for email: ${email}`);
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            throw new Error('Invalid Password');
        }

        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });

        return user;
    },
    signOut(parent, args, ctx, info) {
        ctx.response.clearCookie('token');
        return { message: 'Goodbye!' };
    },
    async requestReset(parent, { email }, ctx, info) {
        const user = await ctx.db.query.user({ where: { email: email } });

        if (!user) {
            throw new Error(`No such user found for email: ${email}`);
        }

        const randomBytesPromisefied = promisify(randomBytes);
        const resetToken = (await randomBytesPromisefied(20)).toString('hex');
        const resetTokenExpiry = Date.now() + 36000000;

        const res = await ctx.db.mutation.updateUser({
            where: {
                email: email,
            },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        const mailRes = await trasport.sendMail({
            from: 'lucca@sickfits.com',
            to: user.email,
            subject: 'Your Password Reset Token',
            html: makeANiceEmail(`Your Password Reset token is here! \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click here to reset</a>`),
        });

        return { message: 'Thanks!' };
    },
    async resetPassword(parent, args, ctx, info) {
        if (args.password !== args.confirmPassword) {
            throw new Error("Passwords don't match");
        }

        const [user] = await ctx.db.query.users({ where: { resetToken: args.resetToken, resetTokenExpiry_gte: Date.now() - 3600000 } });

        if (!user) {
            throw new Error('This token is either invalid or expired');
        }

        const password = await bcrypt.hash(args.password, 10);
        const updatedUser = await ctx.db.mutation.updateUser({
            where: {
                email: user.email,
            },
            data: {
                password,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });

        return updatedUser;
    },
    async updatePermissions(parent, args, ctx, info) {
        if (!ctx.request.userId) {
            throw new Error('You must be logged in!');
        }

        const currentUser = await ctx.db.query.user({ where: { id: ctx.request.userId } }, info);
        hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);

        return ctx.db.mutation.updateUser(
            {
                data: {
                    permissions: {
                        set: args.permissions,
                    },
                },
                where: {
                    id: args.userId,
                },
            },
            info
        );
    },
};

module.exports = Mutations;

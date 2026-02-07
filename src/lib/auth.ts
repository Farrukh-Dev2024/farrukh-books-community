
import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google"
import { createUser, getUser, updateUser, deleteUser, comparePassword } from "@/lib/dbfunctions"
import { getLoginAttempts, setLoginAttempts, MAX_ATTEMPTS, LOCKOUT_TIME } from "@/lib/loginattempts";
import { z } from "zod";
import { UserRoles } from "@/types/project-types";
import { InvalidLoginError } from "./errors";
// export class InvalidLoginError extends CredentialsSignin {
//     code = "Invalid identifier or password";
//     constructor(errorstring: string,) {
//         super();
//         this.code = errorstring;
//     }
// }

const credentialsSchema = z.object({
    email: z.string().email('Invalid email address').min(3, 'Minimum email length is 3').max(100, 'Maximum email length is 100'),
    password: z.string().min(6, 'Minimum password length is 6').max(20, 'Maximum password length is 20'),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
    basePath: '/api/auth',
    trustHost: true,
    debug: false,
    secret: process.env.NEXTAUTH_SECRET,   //this isused for JWT signing and encryption
    providers: [Google({
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        authorization: {
            params: {
                prompt: "consent", access_type: "offline", response_type: "code"
            }
        }, // This is important for getting a refresh token
        profile(profile) {
            return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
            }
        },
    }),
    Credentials({
        credentials: {
            email: {},
            password: {},
        },
        authorize: async (credentials) => {
            
            console.log(credentials);
            const validationResult = credentialsSchema.safeParse(credentials);
            if (!validationResult.success) {
                const errors = validationResult.error.format()
                if (errors.email?._errors.length) {
                    throw new InvalidLoginError(errors.email._errors[0]);
                }
                if (errors.password?._errors.length) {
                    throw new InvalidLoginError(errors.password._errors[0]);
                }
            }
            let userdb = null;
            const memail = credentials.email as string;
            userdb = await getUser({ email: memail })
            let mattemptsdata = null;
            try {
                mattemptsdata = getLoginAttempts(memail);
            } catch (e) {
                console.log("Error in getLoginAttempts %o", e);
                mattemptsdata = null;
            }
            if (mattemptsdata != null) {
                const mlockouttime = mattemptsdata.lastAttempt + LOCKOUT_TIME;
                console.log("%o", mattemptsdata);
                if (mattemptsdata.attempts >= MAX_ATTEMPTS && Date.now() < mlockouttime + 5000) {
                    const displayerror = "Login attempts are over for " + mattemptsdata.email;
                    console.log(displayerror);
                    console.log(String((mlockouttime - Date.now()) / 1000) + " seconds remaining.")

                    throw new InvalidLoginError(displayerror);
                }
                if (Date.now() > mlockouttime) {
                    setLoginAttempts(memail, 0);
                }
            } else {
                setLoginAttempts(memail, 0);
            }
            console.log("credentials.87 . %o", credentials);
            if (!userdb) {
                console.log("Invalid credentials.87");
                throw new InvalidLoginError("cb_authorize: Invalid credentials.");
            } else {
                if (userdb.isBanned) {
                    const displayerror = "user is blocked " + userdb.email;
                    console.log("cb_authorize: " + displayerror);
                    throw new InvalidLoginError(displayerror);
                } else {
                    if (await comparePassword(credentials.password as string, userdb.password)) {
                        if (userdb.email === 'farrukhaleem.dev2024@gmail.com' && userdb.userRole !== UserRoles.SuperAdmin) {
                            await updateUser(userdb.id, {...userdb, userRole: UserRoles.SuperAdmin ,password: ''});
                            userdb.userRole = UserRoles.SuperAdmin;
                        }
                        console.log("User login " + userdb.email);
                        return {
                            id: userdb.id,
                            name: userdb.name,
                            email: userdb.email,
                        };
                        //return credentials;
                    }
                    if (mattemptsdata) {
                        setLoginAttempts(memail, mattemptsdata.attempts + 1);
                    }
                    console.log("Invalid credentials.103");
                    throw new InvalidLoginError("cb_authorize: Invalid credentials.");
                }

            }
            return userdb
        },
    }),
    ],
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            // console.log("signin cb log");
            // console.log("user %o",user);
            // console.log("account %o",account);
            // console.log("profile %o",profile);
            // console.log("email %o",email);
            // console.log("credentials %o",credentials);
            return true;
        },
        // async redirect({ url, baseUrl }) {
        //   'use server'
        //   // console.log("redirect cb log");
        //   // console.log("url %o",url);
        //   // console.log("url %o",baseUrl)

        //   // Allows relative callback URLs
        //   if (url.startsWith("/")) return `${baseUrl}${url}`

        //   // Allows callback URLs on the same origin
        //   if (new URL(url).origin === baseUrl) return url

        //   return baseUrl
        // },
        async session({ session, user, token }) {
            // console.log("session cb log");
            // console.log("session %o",session);
            // console.log("user %o",user);
            // console.log("token %o",token);
            // let userdb = await getUser({ email: session.user.email })
            // if (!userdb) {
            //    userdb = await createUser(session.user.email, "123456789");
            //    userdb = await updateUser(userdb.id, {messages: "We have created password for you which is '123456789',Kindly change it to your own password;"});
            // }else{
            //     if (userdb.isBanned){
            //         throw new InvalidLoginError("session: banned");
            //     }
            // }
            return session
        },
        async jwt({ token, user, account, profile }) {
            // console.log("session cb log");
            // console.log("token %o",token);
            // console.log("user %o",user);
            // console.log("account %o",account);
            // console.log("profile %o",profile);

            // const email = profile?.email || "";
            // let userdb = await getUser({ email });
            // if (!userdb) {
            //   //
            // }else{
            //     if (userdb.isBanned){
            //         throw new InvalidLoginError("jwt: banned");
            //     }
            // }

            // 1️⃣ On sign-in only
            if (user) {
                token.userId = user.id
                token.iat = Math.floor(Date.now() / 1000) // set once
                if (user.email) token.email = user.email
            }

            // 2️⃣ On every request
            if (token.email && token.iat) {
                const userdb = await getUser({ email: token.email })

                if (
                    userdb?.forceLogoutAt &&
                    userdb.forceLogoutAt.getTime() > token.iat * 1000
                ) {
                    await signOut({ redirectTo: "/" })
                    return {} // force logout
                }
            }

            return token;
        }
    },
    pages: {
        signIn: "/",
        //signOut: "/logout",
        //error: "/auth/error", // Error code passed in query string as ?error=
        //verifyRequest: "/auth/verify-request", // (used for check email message)
        //newUser: null, // Will disable the new account creation screen
    },
})
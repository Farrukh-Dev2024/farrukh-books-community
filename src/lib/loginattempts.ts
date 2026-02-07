export const MAX_ATTEMPTS = 5;
export const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes lockout

interface LoginAttempsType{
    email: string;
    attempts: number;
    lastAttempt: number;

}

const loginAttempts:{[key: string]:LoginAttempsType} = {};

export const getLoginAttempts =  (email: string) => {
    return loginAttempts[email] || null;
};

export const setLoginAttempts =  (email:string, attempts:number) => {
    loginAttempts[email] = { email ,attempts, lastAttempt: Date.now() };
};

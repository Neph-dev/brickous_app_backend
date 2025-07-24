export interface CreateUserResponse {
    id?: string;
    email: string;
    role: string;
    status: string;
    type: UserCreationType;
}

export enum UserCreationType {
    NEW_USER = 'NEW_USER',
    EXISTING_USER = 'EXISTING_USER'
}

export interface CreateUserErrorResponse {
    error: string;
    message: string;
    statusCode: number;
}
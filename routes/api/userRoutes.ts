import Router from 'koa-router';
import { 
    getUserProfile,
    updateUserProfile,
    deleteUserAccount,
    getAllUsers,
    getUserTransportType,
    updateUserTransportType
} from '../../controllers/userController';
import { 
    signUp,
    signIn,
    googleSignIn
} from '../../controllers/authController';

const userRoutes = new Router();

userRoutes.post('user/signup', signUp);
userRoutes.post('user/signin', signIn);
userRoutes.post('user/google-signin', googleSignIn);
userRoutes.get('user/profile', getUserProfile);
userRoutes.patch('user/profile', updateUserProfile);
userRoutes.delete('user/delete', deleteUserAccount);
userRoutes.get('user/transportType', getUserTransportType);
userRoutes.patch('user/transportType', updateUserTransportType);
userRoutes.get('users', getAllUsers);

export default userRoutes;

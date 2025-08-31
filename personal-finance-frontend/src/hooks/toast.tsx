import { useContext } from 'react'
import { ToastContext } from '../contexts'

const useToast = () => {
    const context = useContext(ToastContext);

    if(!context){
        throw Error("useToast is used outside of auth context");
    }
    
    return context;
};

export default useToast;
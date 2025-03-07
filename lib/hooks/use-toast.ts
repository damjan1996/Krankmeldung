import { toast } from '@/components/ui/use-toast';

type ToastProps = {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
};

export function useToast() {
    const showToast = ({
                           title = '',
                           description = '',
                           variant = 'default',
                           duration = 3000,
                       }: ToastProps) => {
        return toast({
            title,
            description,
            variant,
            duration,
        });
    };

    return { toast: showToast };
}
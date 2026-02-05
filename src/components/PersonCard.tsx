 import { User, UserPlus, Check, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { useUserConnection } from "@/hooks/useUserConnection";
 import { type SeedPerson } from "@/data/seedData";
 
 interface PersonCardProps {
   person: SeedPerson;
   index: number;
   onClick: () => void;
 }
 
 const PersonCard = ({ person, index, onClick }: PersonCardProps) => {
   const effectiveUserId = `sample-${person.id}`;
   const { connectionState, isLoading, toggleConnection, getConnectionLabel } = useUserConnection(effectiveUserId);
 
   return (
     <button 
       onClick={onClick}
       className="w-full gradient-border animate-fade-in text-left"
       style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
     >
       <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 hover:bg-secondary/50 transition-colors">
         <div className="flex items-start gap-3">
           <div
             className={`w-12 h-12 rounded-full ${person.avatarColor} flex items-center justify-center flex-shrink-0`}
           >
             <User className="w-6 h-6 text-primary" />
           </div>
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 flex-wrap">
               <span className="font-medium text-foreground">
                 {person.name}
               </span>
               {person.badge && (
                 <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                   {person.badge}
                 </span>
               )}
             </div>
             <p className="text-xs text-primary truncate">{person.school}</p>
             <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{person.bio}</p>
           </div>
           <Button 
             size="sm" 
             variant={connectionState === 'none' ? 'outline' : 'secondary'}
             onClick={(e) => {
               e.stopPropagation();
               toggleConnection();
             }}
             disabled={isLoading}
             className="flex-shrink-0"
           >
             {isLoading ? (
               <Loader2 className="w-4 h-4 mr-1 animate-spin" />
             ) : connectionState === 'none' ? (
               <UserPlus className="w-4 h-4 mr-1" />
             ) : (
               <Check className="w-4 h-4 mr-1" />
             )}
             {getConnectionLabel()}
           </Button>
         </div>
       </div>
     </button>
   );
 };
 
 export default PersonCard;
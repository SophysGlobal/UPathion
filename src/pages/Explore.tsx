import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Search, Filter, Users, BookOpen, Calendar, MapPin, UserPlus, User, Clock, Bookmark } from "lucide-react";
import { GradientInput } from "@/components/ui/GradientInput";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  USE_SEED_DATA, 
  seedPeople, 
  seedGroups, 
  seedEvents, 
  seedPlaces,
  type SeedPerson,
  type SeedGroup,
  type SeedEvent,
  type SeedPlace
} from "@/data/seedData";

type ExploreTab = 'people' | 'groups' | 'events' | 'places';

const Explore = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ExploreTab>('people');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { key: ExploreTab; icon: typeof Users; label: string }[] = [
    { key: 'people', icon: Users, label: 'People' },
    { key: 'groups', icon: BookOpen, label: 'Groups' },
    { key: 'events', icon: Calendar, label: 'Events' },
    { key: 'places', icon: MapPin, label: 'Places' },
  ];

  const people = USE_SEED_DATA ? seedPeople : [];
  const groups = USE_SEED_DATA ? seedGroups : [];
  const events = USE_SEED_DATA ? seedEvents : [];
  const places = USE_SEED_DATA ? seedPlaces : [];

  const filteredPeople = useMemo(() => 
    people.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.school.toLowerCase().includes(searchQuery.toLowerCase())
    ), [people, searchQuery]);

  const filteredGroups = useMemo(() => 
    groups.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase())
    ), [groups, searchQuery]);

  const filteredEvents = useMemo(() => 
    events.filter(e => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase())
    ), [events, searchQuery]);

  const filteredPlaces = useMemo(() => 
    places.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase())
    ), [places, searchQuery]);

  const handleViewProfile = (person: SeedPerson) => {
    navigate(`/user/${person.id}`);
  };

  const handleConnect = (person: SeedPerson) => {
    toast.success(`Connection request sent to ${person.name}!`);
  };

  const handleJoinGroup = (group: SeedGroup) => {
    toast.success(`Joined ${group.name}!`);
  };

  const handleViewGroup = (group: SeedGroup) => {
    navigate(`/group/${group.id}`);
  };

  const handleRSVP = (event: SeedEvent) => {
    toast.success(`RSVP'd to ${event.title}!`);
  };

  const handleViewEvent = (event: SeedEvent) => {
    navigate(`/event/${event.id}`);
  };

  const handleSavePlace = (place: SeedPlace) => {
    toast.success(`Saved ${place.name}!`);
  };

  const handleViewPlace = (place: SeedPlace) => {
    navigate(`/place/${place.id}`);
  };

  const renderEmptyState = (type: string) => (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-secondary/50 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
        <Search className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-2">No {type} Yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {type} will appear here when available
      </p>
    </div>
  );

  const renderPeople = () => {
    if (filteredPeople.length === 0) return renderEmptyState('People');
    
    return (
      <div className="space-y-3">
        {filteredPeople.map((person, index) => (
          <div 
            key={person.id}
            className="gradient-border animate-fade-in"
            style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
          >
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleViewProfile(person)}
                  className={`w-12 h-12 rounded-full ${person.avatarColor} flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity`}
                >
                  <User className="w-6 h-6 text-primary" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={() => handleViewProfile(person)}
                      className="font-medium text-foreground hover:underline"
                    >
                      {person.name}
                    </button>
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
                  variant="outline"
                  onClick={() => handleConnect(person)}
                  className="flex-shrink-0"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Connect
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGroups = () => {
    if (filteredGroups.length === 0) return renderEmptyState('Groups');
    
    return (
      <div className="space-y-3">
        {filteredGroups.map((group, index) => (
          <div 
            key={group.id}
            className="gradient-border animate-fade-in"
            style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
          >
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{group.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs">
                      {group.category}
                    </span>
                  </div>
                  <p className="text-xs text-primary truncate">{group.school}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Users className="w-3 h-3 inline mr-1" />
                    {group.memberCount} members
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" onClick={() => handleJoinGroup(group)}>
                    Join
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleViewGroup(group)}>
                    View
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEvents = () => {
    if (filteredEvents.length === 0) return renderEmptyState('Events');
    
    return (
      <div className="space-y-3">
        {filteredEvents.map((event, index) => (
          <div 
            key={event.id}
            className="gradient-border animate-fade-in"
            style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
          >
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{event.title}</span>
                  <p className="text-xs text-primary truncate">{event.school}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {event.location}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Users className="w-3 h-3 inline mr-1" />
                    {event.attendees} attending
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" onClick={() => handleRSVP(event)}>
                    RSVP
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleViewEvent(event)}>
                    View
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPlaces = () => {
    if (filteredPlaces.length === 0) return renderEmptyState('Places');
    
    return (
      <div className="space-y-3">
        {filteredPlaces.map((place, index) => (
          <div 
            key={place.id}
            className="gradient-border animate-fade-in"
            style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
          >
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{place.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs">
                      {place.type}
                    </span>
                  </div>
                  <p className="text-xs text-primary">{place.area}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{place.description}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleSavePlace(place)}>
                    <Bookmark className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleViewPlace(place)}>
                    View
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'people': return renderPeople();
      case 'groups': return renderGroups();
      case 'events': return renderEvents();
      case 'places': return renderPlaces();
    }
  };

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3">
          <Logo showText={false} />
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* Search */}
        <div className="animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <GradientInput 
              placeholder="Search people, groups, events..." 
              className="pl-10 pr-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-secondary transition-colors">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-3 animate-fade-in">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`gradient-border group ${activeTab === tab.key ? 'ring-2 ring-primary/50' : ''}`}
            >
              <div className={`bg-card/90 backdrop-blur-sm rounded-lg p-4 text-center transition-colors ${
                activeTab === tab.key ? 'bg-primary/10' : 'group-hover:bg-secondary/50'
              }`}>
                <tab.icon className={`w-6 h-6 mx-auto mb-2 ${
                  activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <p className={`text-xs font-medium ${
                  activeTab === tab.key ? 'text-primary' : 'text-foreground'
                }`}>{tab.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Explore;

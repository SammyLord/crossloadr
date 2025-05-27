import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Paper,
  Button,
  IconButton,
  Chip
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AppCard from '../components/AppCard';
import AppStoreFilters from '../components/AppStoreFilters';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  developer: string;
  category: string;
  status: 'active' | 'pending' | 'suspended';
  lastScan: string;
  scanResult: {
    status: 'pass' | 'fail';
    vulnerabilities: string[];
  };
  rating?: number;
  downloads?: number;
  featured?: boolean;
  ageRating?: string;
  inAppPurchases?: boolean;
  screenshots?: string[];
  size?: string;
  version?: string;
  releaseDate?: string;
}

const ITEMS_PER_PAGE = 12;

export default function AppStore() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState<number[]>([0, 5]);
  const [page, setPage] = useState(1);

  const { data: apps, isLoading, error } = useQuery<App[]>({
    queryKey: ['apps'],
    queryFn: async () => {
      const response = await axios.get('/api/apps');
      return response.data;
    }
  });

  const categories = ['All', 'Productivity', 'Entertainment', 'Social', 'Tools', 'Education'];

  const featuredApps = apps?.filter(app => app.featured && app.status === 'active') || [];
  const filteredApps = apps?.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || app.category === selectedCategory;
    const matchesRating = app.rating ? app.rating >= ratingFilter[0] && app.rating <= ratingFilter[1] : true;
    return matchesSearch && matchesCategory && matchesRating && app.status === 'active';
  });

  const sortedApps = filteredApps?.sort((a, b) => {
    switch (selectedSort) {
      case 'newest':
        return new Date(b.lastScan).getTime() - new Date(a.lastScan).getTime();
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'downloads':
        return (b.downloads || 0) - (a.downloads || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const paginatedApps = sortedApps?.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Error loading apps. Please try again later.</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Featured Apps Carousel */}
      {featuredApps.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            style={{
              '--swiper-navigation-color': theme.palette.primary.main,
              '--swiper-pagination-color': theme.palette.primary.main,
            } as any}
          >
            {featuredApps.map((app) => (
              <SwiperSlide key={app.id}>
                <Box
                  sx={{
                    height: { xs: 300, md: 400 },
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'grey.900',
                  }}
                >
                  <Box
                    component="img"
                    src={app.icon}
                    alt={app.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.7,
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 3,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      color: 'white',
                    }}
                  >
                    <Typography variant="h4" component="h2" gutterBottom>
                      {app.name}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      {app.developer}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        href={`/store/app/${app.id}`}
                      >
                        Learn More
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Today's Picks */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Today's Picks
            </Typography>
            <Button
              endIcon={<ArrowForwardIcon />}
              href="/store?sort=rating"
              sx={{ textTransform: 'none' }}
            >
              See All
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            {sortedApps?.slice(0, 5).map((app) => (
              <Box key={app.id} sx={{ minWidth: 200, flexShrink: 0 }}>
                <AppCard app={app} variant="compact" />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Categories */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Categories
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {categories.filter(cat => cat !== 'All').map((category) => (
              <Paper
                key={category}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
                onClick={() => setSelectedCategory(category)}
              >
                <Typography variant="h6">{category}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {sortedApps?.filter(app => app.category === category).length} apps
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Search and Filters */}
        <AppStoreFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          ratingFilter={ratingFilter}
          onRatingChange={setRatingFilter}
          categories={categories}
        />

        {/* App Grid */}
        {filteredApps?.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography color="text.secondary">
              No apps found matching your criteria.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
            {paginatedApps?.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </Box>
        )}

        {/* Load More */}
        {sortedApps && sortedApps.length > page * ITEMS_PER_PAGE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => setPage(p => p + 1)}
              sx={{ textTransform: 'none' }}
            >
              Load More
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
} 
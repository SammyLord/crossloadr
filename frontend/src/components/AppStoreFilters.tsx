import {
  Box,
  TextField,
  InputAdornment,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Typography,
  Slider,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useState } from 'react';

interface AppStoreFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  ratingFilter: number[];
  onRatingChange: (rating: number[]) => void;
  categories: string[];
}

export default function AppStoreFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSort,
  onSortChange,
  ratingFilter,
  onRatingChange,
  categories
}: AppStoreFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleSortChange = (event: SelectChangeEvent) => {
    onSortChange(event.target.value);
  };

  const handleRatingChange = (_event: Event, newValue: number | number[]) => {
    onRatingChange(newValue as number[]);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <IconButton
          color={showFilters ? 'primary' : 'default'}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ display: { sm: 'none' } }}
        >
          {showFilters ? <CloseIcon /> : <FilterIcon />}
        </IconButton>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flexWrap: 'wrap',
            gap: 1,
            flex: 1
          }}
        >
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              onClick={() => onCategoryChange(category === selectedCategory ? null : category)}
              color={category === selectedCategory ? 'primary' : 'default'}
              variant={category === selectedCategory ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={selectedSort}
            label="Sort By"
            onChange={handleSortChange}
            size="small"
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="rating">Highest Rated</MenuItem>
            <MenuItem value="downloads">Most Downloaded</MenuItem>
            <MenuItem value="name">Name (A-Z)</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Collapse in={showFilters}>
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography gutterBottom>Rating Filter</Typography>
          <Slider
            value={ratingFilter}
            onChange={handleRatingChange}
            valueLabelDisplay="auto"
            min={0}
            max={5}
            step={0.5}
            marks={[
              { value: 0, label: '0' },
              { value: 2.5, label: '2.5' },
              { value: 5, label: '5' }
            ]}
          />
        </Box>
      </Collapse>
    </Box>
  );
} 
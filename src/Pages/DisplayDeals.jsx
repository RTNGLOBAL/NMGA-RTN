import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  useTheme,
  useMediaQuery,
  Avatar,
  TablePagination,
  Pagination,
  Paper,
  Badge,
  Collapse,
  Chip,
  Divider,
  InputAdornment,
  Stack,
  ButtonGroup,
  Skeleton,
} from "@mui/material";
import { Favorite, ShoppingCart, FavoriteBorder, Visibility, FilterList, ExpandLess, ExpandMore, Clear, FilterAlt, Search, ViewModule, ViewList, ViewComfy, Sort, Groups } from "@mui/icons-material";
import axios from "axios";
import { styled } from '@mui/material/styles';
import Toast from '../Components/Toast/Toast';
import { useNavigate } from 'react-router-dom';
import { FilterTextField, FilterSelect, FilterFormControl } from '../Dashboards/DashBoardComponents/FilterStyles';
import { FilterSection, FilterItem } from '../Dashboards/DashBoardComponents/FilterSection';
import { GridCardsSkeleton } from '../Components/Skeletons/LoadingSkeletons';

const StyledSlider = styled(Slider)(({ theme }) => ({
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
    borderRadius: 4,
  },
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
    '&:before': {
      display: 'none',
    },
  },
  '& .MuiSlider-valueLabel': {
    lineHeight: 1.2,
    fontSize: 12,
    background: 'unset',
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: '50% 50% 50% 0',
    backgroundColor: theme.palette.primary.main,
    transformOrigin: 'bottom left',
    transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
    '&:before': { display: 'none' },
    '&.MuiSlider-valueLabelOpen': {
      transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
    },
    '& > *': {
      transform: 'rotate(45deg)',
    },
  },
}));

const DisplayDeals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [getDealOpen, setGetDealOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [userFavorites, setUserFavorites] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [category, setCategory] = useState("");
  const [minQuantity, setMinQuantity] = useState([1, 100]);
  const [categories, setCategories] = useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid');

  const [filter, setFilter] = useState({
    searchQuery: '',
    category: '',
    priceRange: [1, 1000],
    minQuantity: [1, 100]
  });

  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const filterDebounceTimeout = useRef(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/deals/fetchAll/buy`);
        setDeals(response.data);
        setFilteredDeals(response.data);

        const uniqueCategories = [...new Set(response.data.map(deal => deal.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        setError("Error fetching deals. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  useEffect(() => {
    setIsFilterLoading(true);
    if (filterDebounceTimeout.current) {
      clearTimeout(filterDebounceTimeout.current);
    }

    filterDebounceTimeout.current = setTimeout(() => {
      let filtered = [...deals];

      if (filter.searchQuery) {
        filtered = filtered.filter(deal => 
          (deal.name?.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
           deal.description?.toLowerCase().includes(filter.searchQuery.toLowerCase()))
        );
      }

      if (filter.category) {
        filtered = filtered.filter(deal => 
          deal.category && deal.category === filter.category
        );
      }

      if (filter.priceRange[0] !== 0 || filter.priceRange[1] !== 1000) {
        filtered = filtered.filter(deal =>
          deal.discountPrice != null &&
          deal.discountPrice >= filter.priceRange[0] && 
          deal.discountPrice <= filter.priceRange[1]
        );
      }

      if (filter.minQuantity[0] !== 1 || filter.minQuantity[1] !== 100) {
        filtered = filtered.filter(deal =>
          deal.minQuantity != null &&
          deal.minQuantity >= filter.minQuantity[0] && 
          deal.minQuantity <= filter.minQuantity[1]
        );
      }

      setFilteredDeals(filtered);
      setIsFilterLoading(false);
    }, 300); // 300ms debounce

    return () => {
      if (filterDebounceTimeout.current) {
        clearTimeout(filterDebounceTimeout.current);
      }
    };
  }, [filter, deals]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const user_role = localStorage.getItem('user_role');
    const user_id = localStorage.getItem('user_id');
    
    if (!token || !user_role || !user_id) {
      setToast({
        open: true,
        message: 'Please login to perform this action',
        severity: 'warning'
      });
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleOpenView = (deal) => {
    navigate(`/deals-catlog/deals/${deal._id}`);
  };
  const handleCloseView = () => setSelectedDeal(null);

  const handleOpenGetDeal = (deal) => {
    if (!checkAuth()) return;
    setSelectedDeal(deal);
    setGetDealOpen(true);
  };
  
  const handleCloseGetDeal = () => {
    setGetDealOpen(false);
    setQuantity(1);
  };

  const user_id = localStorage.getItem("user_id");
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/deals/favorite`,
          { params: { user_id } }
        );
        setUserFavorites(response.data.map((fav) => fav.dealId));
      } catch (error) {
        console.error("Error fetching favorites", error);
      }
    };
  
    fetchFavorites();
  }, []);
  
  const toggleFavorite = async (dealId) => {
    if (!checkAuth()) return;
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/deals/favorite/toggle`,
        { dealId, user_id }
      );
      setUserFavorites(response.data.favorites);
      setToast({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
    } catch (error) {
      console.error("Error updating favorites", error);
      setToast({
        open: true,
        message: error.response?.data?.error || "Error updating favorites",
        severity: 'error'
      });
    }
  };

  const handleCommitDeal = async () => {
    if (!checkAuth()) return;
    if (!selectedDeal) return;

    // Validate minimum quantity
    if (quantity < selectedDeal.minQtyForDiscount) {
      setToast({
        open: true,
        message: `Minimum quantity required for discount is ${selectedDeal.minQtyForDiscount}`,
        severity: 'error'
      });
      return;
    }

    const totalPrice = quantity * selectedDeal.discountPrice;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/deals/commit/buy/${selectedDeal._id}`,
        {
          dealId: selectedDeal._id,
          userId: user_id,
          quantity,
          totalPrice,
        }
      );

      setToast({
        open: true,
        message: "Deal commitment submitted successfully!",
        severity: 'success'
      });
      handleCloseGetDeal();

      // Refresh deals list after commitment
      const dealsResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/deals/fetchAll/buy`);
      setDeals(dealsResponse.data);
      setFilteredDeals(dealsResponse.data);
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || "Error submitting deal commitment",
        severity: 'error'
      });
    }
  };

  const handleFilterChange = (name, value) => {
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilter({
      searchQuery: '',
      category: '',
      priceRange: [0, 1000],
      minQuantity: [1, 100]
    });
  };

  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedDeals = filteredDeals.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getGridColumns = () => {
    switch (viewMode) {
      case 'grid':
        return {
          xs: 12,
          sm: 6,
          md: 4,
          lg: 4,
          xl: 3
        };
      case 'compact':
        return {
          xs: 12,
          sm: 6,
          md: 3,
          lg: 3,
          xl: 2
        };
      case 'list':
        return {
          xs: 12
        };
      default:
        return {
          xs: 12,
          sm: 6,
          md: 4,
          lg: 4,
          xl: 3
        };
    }
  };


  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f3f4f6, #ffffff)',
      pb: 4
    }}>
      {/* Header Section */}
      <Box sx={{ 
        background: 'linear-gradient(45deg, #1a237e, #0d47a1)',
        color: 'white',
        py: { xs: 4, md: 6 },
        px: { xs: 2, sm: 4 },
        mb: 4
      }}>
        <Container maxWidth="xl">
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 3
          }}>
            <Box>
              <Typography 
                variant="h3" 
                fontWeight="800"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  mb: 1,
                  background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                }}
              >
                Exclusive Deals
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  opacity: 0.9,
                  fontWeight: 400,
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                Discover amazing products at unbeatable prices
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              flexWrap: 'wrap'
            }}>
              {!isMobile && (
                <ButtonGroup 
                  variant="contained" 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    '& .MuiButton-root': {
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      px: 3,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                      }
                    }
                  }}
                >
                 
                </ButtonGroup>
              )}
              {isMobile && (
              <Button
                variant="contained"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                startIcon={<FilterList />}
                endIcon={mobileFiltersOpen ? <ExpandLess /> : <ExpandMore />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: 3,
                  px: 3,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  }
                }}
              >
                Filters {filteredDeals.length > 0 && `(${filteredDeals.length})`}
              
              </Button>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="100%">
        <Box sx={{ 
          display: 'flex',
          gap: { xs: 2, lg: 4 },
          flexDirection: { xs: 'column', lg: 'row' }
        }}>
          {/* Filters Panel */}
          <Paper
            elevation={0}
            sx={{ 
              width: { xs: '100%', lg: '300px' },
              flexShrink: 0,
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'divider',
              position: { xs: 'static', lg: 'sticky' },
              top: 24,
              height: { lg: 'calc(100vh - 200px)' },
              display: { xs: mobileFiltersOpen ? 'block' : 'none', lg: 'block' }
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Filter Products
              </Typography>
              
              <Stack spacing={3}>
                <TextField
                  placeholder="Search products..."
                  value={filter.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: 'grey.50',
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                      '& fieldset': {
                        borderColor: 'transparent'
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Categories
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1 
                  }}>
                    {categories.map((cat) => (
                      <Chip
                        key={cat}
                        label={cat}
                        onClick={() => handleFilterChange('category', cat === filter.category ? '' : cat)}
                        variant={filter.category === cat ? "filled" : "outlined"}
                        color="primary"
                        sx={{
                          borderRadius: 2,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 1
                          },
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Price Range: ${filter.priceRange[0]} - ${filter.priceRange[1]}
                  </Typography>
                  <StyledSlider
                    value={filter.priceRange}
                    onChange={(e, newValue) => handleFilterChange('priceRange', newValue)}
                    min={0}
                    max={1000}
                    valueLabelDisplay="auto"
                    sx={{
                      color: 'primary.main',
                      '& .MuiSlider-thumb': {
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)'
                        }
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Minimum Quantity: {filter.minQuantity[0]} - {filter.minQuantity[1]} units
                  </Typography>
                  <StyledSlider
                    value={filter.minQuantity}
                    onChange={(e, newValue) => handleFilterChange('minQuantity', newValue)}
                    min={1}
                    max={100}
                    valueLabelDisplay="auto"
                    sx={{
                      color: 'primary.main',
                      '& .MuiSlider-thumb': {
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)'
                        }
                      }
                    }}
                  />
                </Box>

                {Object.values(filter).some(value => 
                  value !== '' && 
                  (Array.isArray(value) ? 
                    (value[0] !== 1 && value[1] !== 100) || (value[0] !== 0 && value[1] !== 1000) 
                    : true)
                ) && (
                  <Button
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={clearFilters}
                    color="error"
                    sx={{
                      borderRadius: 3,
                      textTransform: 'none'
                    }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </Stack>
            </Box>
          </Paper>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1 }}>
            {loading || isFilterLoading ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: 2
              }}>
                <CircularProgress size={40} />
                <Typography color="text.secondary">
                  {loading ? 'Loading deals...' : 'Applying filters...'}
                </Typography>
              </Box>
            ) : error ? (
              <Alert 
                severity="error" 
                sx={{ borderRadius: 3 }}
              >
                {error}
              </Alert>
            ) : filteredDeals.length > 0 ? (
              <Grid 
                container 
                spacing={3}
                columns={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
                sx={{
                  width: '100%',
                  margin: 0,
                  '& .MuiGrid-item': {
                    width: { xs: '100%', sm: '50%', md: '300px' },
                    padding: 1.5,
                  }
                }}
              >
                {paginatedDeals.map((deal) => (
                  <Grid item key={deal._id}>
                    <Card
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        overflow: 'hidden',
                        transition: "all 0.3s ease",
                        bgcolor: 'white',
                        position: 'relative',
                        "&:hover": { 
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.12)' 
                        },
                      }}
                    >
                      {/* Discount Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          bgcolor: 'error.main',
                          color: 'white',
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          zIndex: 1,
                          boxShadow: 2
                        }}
                      >
                        Save {Math.round(((deal.originalCost - deal.discountPrice) / deal.originalCost) * 100)}%
                      </Box>

                      {/* Image Section */}
                      <Box 
                        sx={{ 
                          position: 'relative',
                          width: '100%',
                          pt: '60%'
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={deal.images[0]}
                          alt={deal.name}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                            p: 1.5,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={deal.category}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.9)',
                                color: 'text.primary',
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                height: '24px'
                              }}
                            />
                            <Chip
                              label={`${deal.totalSold} sold`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.9)',
                                color: 'success.main',
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                height: '24px'
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'white',
                              bgcolor: 'rgba(0,0,0,0.5)',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontWeight: 500,
                              fontSize: '0.75rem'
                            }}
                          >
                            Ends {new Date(deal.dealEndsAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Content Section */}
                      <CardContent 
                        sx={{ 
                          p: 2,
                          '&:last-child': { pb: 2 }
                        }}
                      >
                        <Box sx={{ mb: 1.5 }}>
                          {/* Title and Price Row */}
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 1,
                            mb: 1
                          }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{
                                fontWeight: 600,
                                fontSize: '1rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.2,
                                flex: 1
                              }}
                            >
                              {deal.name}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <Typography 
                                variant="subtitle1" 
                                color="primary" 
                                fontWeight="bold"
                              >
                                ${deal.discountPrice}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ textDecoration: 'line-through' }}
                              >
                                ${deal.originalCost}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Distributor and Stats Row */}
                          <Box sx={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              flex: 1
                            }}>
                              <Avatar 
                                src={deal.distributor?.logo}
                                alt={deal.distributor?.businessName}
                                sx={{ width: 30, height: 30 }}
                              >
                                {deal.distributor?.businessName?.charAt(0) || 'D'}
                              </Avatar>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {deal.distributor?.businessName || 'Unknown Distributor'}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="success.main"
                              fontWeight="500"
                            >
                              Save ${(deal.originalCost - deal.discountPrice).toFixed(2)}/unit
                            </Typography>
                          </Box>

                          {/* Quick Stats */}
                          <Box sx={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start',
                            gap: 1,
                            p: 1,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            mb: 1.5
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,  }}>
                              <Visibility sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {deal.views || 0}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, }}>
                              <Groups sx={{ fontSize: '0.875rem', color: 'primary.main' }} />
                              <Typography variant="caption" color="primary">
                                Min: {deal.minQtyForDiscount}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, }}>
                              <ShoppingCart sx={{ fontSize: '0.875rem', color: 'success.main' }} />
                              <Typography variant="caption" color="success.main">
                                {deal.totalSold} sold
                              </Typography>
                            </Box>
                          </Box>

                          {/* Description Preview */}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3,
                              mb: 1.5,
                              fontSize: '0.75rem'
                            }}
                          >
                            {deal.description}
                          </Typography>

                          {/* Action Buttons */}
                          <Box sx={{ 
                            display: 'flex',
                            gap: 1
                          }}>
                            <Button
                              variant="contained"
                              size="small"
                              fullWidth
                              onClick={() => handleOpenGetDeal(deal)}
                              sx={{ 
                                borderRadius: 1,
                                py: 0.5,
                                textTransform: 'none',
                                fontWeight: 600,
                                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                                '&:hover': {
                                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
                                }
                              }}
                              startIcon={<ShoppingCart sx={{ fontSize: '1rem' }} />}
                            >
                              Get Deal
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenView(deal)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 0.5
                              }}
                            >
                              <Visibility sx={{ fontSize: '1.25rem' }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => toggleFavorite(deal._id)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 0.5,
                                color: userFavorites.includes(deal._id) ? 'error.main' : 'inherit'
                              }}
                            >
                              {userFavorites.includes(deal._id) ? 
                                <Favorite sx={{ fontSize: '1.25rem' }} /> : 
                                <FavoriteBorder sx={{ fontSize: '1.25rem' }} />
                              }
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : deals.length > 0 ? (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  bgcolor: 'white',
                  borderRadius: 4,
                  border: '1px dashed',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No deals match your current filters
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Try adjusting your search criteria
                </Typography>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  bgcolor: 'white',
                  borderRadius: 4,
                  border: '1px dashed',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  No active deals available
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {filteredDeals.length > 0 && (
              <Box sx={{ 
                mt: 4, 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap'
              }}>
                <TablePagination
                  component="div"
                  count={filteredDeals.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[12, 24, 36, 48]}
                  labelRowsPerPage="Items per page:"
                  sx={{
                    '.MuiTablePagination-select': {
                      borderRadius: 2,
                      bgcolor: 'white',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                />
                <Pagination
                  count={Math.ceil(filteredDeals.length / rowsPerPage)}
                  page={page + 1}
                  onChange={(e, p) => setPage(p - 1)}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 2,
                      '&.Mui-selected': {
                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark'
                        }
                      }
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      {/* Dialogs */}
      <Dialog 
        open={getDealOpen} 
        onClose={handleCloseGetDeal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: 'background.paper'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Get Deal: {selectedDeal?.name}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              bgcolor: 'primary.lighter',
              borderRadius: 3
            }}>
              <Avatar
                src={selectedDeal?.images[0]}
                alt={selectedDeal?.name}
                variant="rounded"
                sx={{ width: 80, height: 80 }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {selectedDeal?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedDeal?.distributor?.businessName}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2
            }}>
              <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Original Price
                </Typography>
                <Typography variant="h6" sx={{ textDecoration: 'line-through', opacity: 0.7 }}>
                  ${selectedDeal?.originalCost}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'primary.lighter' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Discount Price
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  ${selectedDeal?.discountPrice}
                </Typography>
              </Paper>
            </Box>

            <TextField
              label="Quantity"
              type="number"
              fullWidth
              variant="outlined"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              error={quantity < (selectedDeal?.minQtyForDiscount || 0)}
              helperText={quantity < (selectedDeal?.minQtyForDiscount || 0) ? 
                `Minimum quantity required: ${selectedDeal?.minQtyForDiscount}` : ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3
                }
              }}
            />

            <Paper 
              elevation={0}
              sx={{ 
                p: 2,
                borderRadius: 3,
                bgcolor: 'primary.lighter'
              }}
            >
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Typography variant="subtitle1">Subtotal:</Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  ${(quantity * (selectedDeal?.discountPrice || 0)).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                color: 'success.main'
              }}>
                <Typography variant="subtitle1">You Save:</Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  ${(quantity * ((selectedDeal?.originalCost || 0) - (selectedDeal?.discountPrice || 0))).toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleCloseGetDeal}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCommitDeal}
            disabled={quantity < (selectedDeal?.minQtyForDiscount || 0)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              '&:not(:disabled)': {
                boxShadow: '0 3px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                }
              }
            }}
          >
            Confirm Purchase
          </Button>
        </DialogActions>
      </Dialog>

      <Toast 
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        handleClose={handleToastClose}
      />
    </Box>
  );
};

export default DisplayDeals;
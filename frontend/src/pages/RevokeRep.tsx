import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  RemoveCircle,
  Person,
  Warning,
  History,
  TrendingDown,
  Info,
  Undo
} from '@mui/icons-material';
import { getPlugActor } from '../components/canister/reputationDao';

interface RevokeTransaction {
  id: string;
  recipient: string;
  amount: number;
  reason: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  revokedBy: string;
}

interface BackendTransaction {
  id: bigint;
  transactionType: { Award: null } | { Revoke: null };
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint;
  reason: [] | [string];
}

const RevokeRep: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [totalPointsRevoked , setTotalPointsRevoked] = useState(0);
  const [totalRevocations, setTotalRevocations] = useState(0);
  const [recentRevocations, setRecentRevocations] = useState<RevokeTransaction[]>([
    
  ]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Load recent revocations from blockchain
  const loadRecentRevocations = async () => {
    try {
      console.log('🔗 Getting Plug actor connection...');
      const actor = await getPlugActor();
      console.log('✅ Actor connected:', !!actor);

      console.log('📞 Calling getTransactionHistory()...');
      const transactions = await actor.getTransactionHistory() as BackendTransaction[];
      console.log('📊 Raw transactions for revocations:', transactions);

      if (!transactions || transactions.length === 0) {
        console.log('No transactions found from blockchain');
        return;
      }

      // Filter and convert revoke transactions
      const revokeTransactions = transactions
        .filter(tx => 'Revoke' in tx.transactionType)
        .slice(0, 10) // Get latest 10 revocations
        .map((tx, index) => ({
          id: index.toString(),
          recipient: tx.to.toString(),
          amount: Number(tx.amount),
          reason: tx.reason.length > 0 ? tx.reason[0]! : 'No reason provided',
          date: new Date(Number(tx.timestamp) / 1000000).toLocaleDateString(),
          status: 'completed' as const,
          revokedBy: tx.from.toString().slice(0, 8) + '...'
        }));

      console.log('Processed revoke transactions:', revokeTransactions);

      if (revokeTransactions.length > 0) {
        setRecentRevocations(revokeTransactions);
      }

      // Calculate total points revoked
      const totalPointsRevoked = revokeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      console.log('Total points revoked:', totalPointsRevoked);

      // Update state or perform actions based on totalPointsRevoked
      setTotalPointsRevoked(totalPointsRevoked);

      const totalRevocations = revokeTransactions.length;
      setTotalRevocations(totalRevocations);

    } catch (error) {
      console.error('Error loading recent revocations:', error);
    }
  };

  // Load recent revocations on component mount
  useEffect(() => {
    loadRecentRevocations();
  }, []);

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient || !amount || !reason) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'warning'
      });
      return;
    }

    // Validate Principal ID format
    try {
      Principal.fromText(recipient);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Invalid Principal ID format',
        severity: 'error'
      });
      return;
    }

    // Validate amount
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setSnackbar({
        open: true,
        message: 'Amount must be a positive number',
        severity: 'error'
      });
      return;
    }

    setConfirmDialog(true);
  };

  const handleConfirmRevoke = async () => {
    setConfirmDialog(false);
    setIsLoading(true);

    try {
      const actor = await getPlugActor();
      if (!actor) {
        throw new Error('Failed to connect to blockchain. Please ensure you are logged in.');
      }

      const recipientPrincipal = Principal.fromText(recipient);
      const numAmount = parseInt(amount);

      console.log('Revoking reputation:', {
        to: recipientPrincipal.toString(),
        amount: numAmount,
        reason: reason
      });

      // Call the revoke function on the blockchain
      await actor.revokeRep(recipientPrincipal, BigInt(numAmount), [reason]);

      setSnackbar({
        open: true,
        message: `Successfully revoked ${amount} reputation points from ${recipient}`,
        severity: 'success'
      });

      // Reset form
      setRecipient('');
      setAmount('');
      setReason('');
      setCategory('');

      // Reload recent revocations
      setTimeout(() => {
        loadRecentRevocations();
      }, 1000);

    } catch (error) {
      console.error('Error revoking reputation:', error);
      setSnackbar({
        open: true,
        message: 'Failed to revoke reputation: ' + (error as Error).message,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: 'hsl(var(--background))',
      minHeight: '100vh'
    }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 3, 
          color: 'hsl(var(--foreground))',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <RemoveCircle sx={{ color: 'hsl(var(--destructive))' }} />
        Revoke Reputation
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Revoke Form */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  color: 'hsl(var(--foreground))',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Warning sx={{ color: 'hsl(var(--destructive))' }} />
                Revoke Reputation Points
              </Typography>

              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 3,
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  border: '1px solid rgba(255, 152, 0, 0.2)',
                  '& .MuiAlert-message': {
                    color: 'hsl(var(--foreground))'
                  }
                }}
              >
                <Typography variant="body2">
                  <strong>Warning:</strong> Revoking reputation points is a serious action that cannot be easily undone. 
                  Please ensure you have valid reasons and proper authorization.
                </Typography>
              </Alert>

              <Box component="form" onSubmit={handleRevokeSubmit}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 3,
                    mb: 3,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Recipient Address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter Principal ID (e.g. rdmx6-jaaaa-aaaah-qcaiq-cai)"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'hsl(var(--muted-foreground))' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'hsl(var(--background))',
                        '& fieldset': {
                          borderColor: 'hsl(var(--border))',
                        },
                        '&:hover fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                      '& .MuiInputBase-input': {
                        color: 'hsl(var(--foreground))',
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Reputation Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to revoke"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <RemoveCircle sx={{ color: 'hsl(var(--muted-foreground))' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'hsl(var(--background))',
                        '& fieldset': {
                          borderColor: 'hsl(var(--border))',
                        },
                        '&:hover fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                      '& .MuiInputBase-input': {
                        color: 'hsl(var(--foreground))',
                      },
                    }}
                  />
                </Box>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel sx={{ color: 'hsl(var(--muted-foreground))' }}>Revocation Category</InputLabel>
                  <Select
                    value={category}
                    label="Revocation Category"
                    onChange={(e) => setCategory(e.target.value)}
                    sx={{
                      backgroundColor: 'hsl(var(--background))',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'hsl(var(--border))',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'hsl(var(--primary))',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'hsl(var(--primary))',
                      },
                      '& .MuiSelect-select': {
                        color: 'hsl(var(--foreground))',
                      },
                    }}
                  >
                    <MenuItem value="policy_violation">Policy Violation</MenuItem>
                    <MenuItem value="spam">Spam Activity</MenuItem>
                    <MenuItem value="fraud">Fraudulent Behavior</MenuItem>
                    <MenuItem value="misconduct">Misconduct</MenuItem>
                    <MenuItem value="inactive">Inactivity</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Reason for Revocation"
                  multiline
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide detailed explanation for this revocation action"
                  required
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'hsl(var(--background))',
                      '& fieldset': {
                        borderColor: 'hsl(var(--border))',
                      },
                      '&:hover fieldset': {
                        borderColor: 'hsl(var(--primary))',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'hsl(var(--primary))',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'hsl(var(--muted-foreground))',
                    },
                    '& .MuiInputBase-input': {
                      color: 'hsl(var(--foreground))',
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  startIcon={<RemoveCircle />}
                  sx={{
                    backgroundColor: 'hsl(var(--destructive))',
                    color: 'hsl(var(--destructive-foreground))',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    '&:hover': {
                      backgroundColor: 'hsl(var(--destructive) / 0.9)',
                    },
                    '&:disabled': {
                      backgroundColor: 'hsl(var(--muted))',
                    },
                  }}
                >
                  {isLoading ? 'Revoking...' : 'Revoke Reputation'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Revocation Summary */}
        <Box sx={{ width: { xs: '100%', lg: '300px' } }}>
          <Card sx={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  color: 'hsl(var(--foreground))',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <TrendingDown sx={{ color: 'hsl(var(--destructive))' }} />
                Revocation Summary
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  p: 2,
                  backgroundColor: 'hsl(var(--muted))',
                  borderRadius: 1,
                  border: '1px solid hsl(var(--border))'
                }}>
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Revocations
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--destructive))', 
                    fontWeight: 600 
                  }}>
                    {totalRevocations}
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  p: 2,
                  backgroundColor: 'hsl(var(--muted))',
                  borderRadius: 1,
                  border: '1px solid hsl(var(--border))'
                }}>
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Total Points Revoked
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600 
                  }}>
                      {totalPointsRevoked} REP
                  </Typography>
                </Box>

                
              </Box>

              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.2)',
                  '& .MuiAlert-message': {
                    color: 'hsl(var(--foreground))'
                  }
                }}
              >
                <Typography variant="body2">
                  All revocations are logged and require administrative approval.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Recent Revocations */}
      <Box sx={{ mt: 3 }}>
        <Card sx={{ 
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                color: 'hsl(var(--foreground))',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <History sx={{ color: 'hsl(var(--destructive))' }} />
              Recent Revocations
            </Typography>

            <TableContainer component={Paper} sx={{ 
              backgroundColor: 'hsl(var(--background))',
              boxShadow: 'none',
              border: '1px solid hsl(var(--border))'
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'hsl(var(--card))' }}>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Recipient
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Reason
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentRevocations.map((revocation) => (
                    <TableRow 
                      key={revocation.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'hsl(var(--card))' 
                        } 
                      }}
                    >
                      <TableCell sx={{ 
                        color: 'hsl(var(--foreground))',
                        borderBottom: '1px solid hsl(var(--border))'
                      }}>
                        {revocation.recipient}
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--destructive))', 
                        fontWeight: 600,
                        borderBottom: '1px solid hsl(var(--border))'
                      }}>
                        -{revocation.amount} REP
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--muted-foreground))',
                        borderBottom: '1px solid hsl(var(--border))',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {revocation.reason}
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--muted-foreground))',
                        borderBottom: '1px solid hsl(var(--border))'
                      }}>
                        {revocation.date}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <Chip
                          label={revocation.status}
                          color={getStatusColor(revocation.status) as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              sx={{ color: 'hsl(var(--muted-foreground))' }}
                            >
                              <Info />
                            </IconButton>
                          </Tooltip>
                          {revocation.status === 'pending' && (
                            <Tooltip title="Undo Revocation">
                              <IconButton 
                                size="small"
                                sx={{ color: 'hsl(var(--destructive))' }}
                              >
                                <Undo />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title" sx={{ color: 'hsl(var(--foreground))' }}>
          Confirm Reputation Revocation
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description" sx={{ color: 'hsl(var(--muted-foreground))' }}>
            Are you sure you want to revoke <strong>{amount} reputation points</strong> from <strong>{recipient}</strong>?
            This action requires administrative approval and will be logged for audit purposes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} sx={{ color: 'hsl(var(--muted-foreground))' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmRevoke} 
            sx={{ 
              color: 'hsl(var(--destructive))',
              fontWeight: 600
            }}
            autoFocus
          >
            Confirm Revocation
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RevokeRep;

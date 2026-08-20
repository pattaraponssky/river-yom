'use client';

import { useRef, useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  Paper,
  Divider,
  Chip,
  Stack,
} from '@mui/material';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

import { API_URL } from '@/lib/utility';

const FILE_TYPES = [
  {
    value: '3dams',
    label: 'รูปสภาพน้ำในเขื่อน',
    filename: '3dams.jpg',
    accept: 'image/jpeg,image/png',
    type: 'image',
    description: 'รูปภาพแสดงสภาพน้ำในเขื่อนประจำวัน',
  },
  {
    value: 'onepages',
    label: 'รูปสถานการณ์น้ำ สชป.3',
    filename: 'onepages.jpg',
    accept: 'image/jpeg,image/png',
    type: 'image',
    description: 'สถานการณ์น้ำ สำนักงานชลประทานที่ 3',
  },
  {
    value: 'dailyreport',
    label: 'รูปสรุปสถานการณ์น้ำ',
    filename: 'dailyreport.jpg',
    accept: 'image/jpeg,image/png',
    type: 'image',
    description: 'สรุปสถานการณ์น้ำและการเฝ้าระวัง',
  },
  {
    value: 'report',
    label: 'แผนผังรูปแบบ PDF',
    filename: 'report.pdf',
    accept: 'application/pdf',
    type: 'pdf',
    description: 'รายงานแผนผังรูปแบบ PDF',
  },
  {
    value: 'rpt',
    label: 'รายงานประจำวัน PDF',
    filename: 'rpt.pdf',
    accept: 'application/pdf',
    type: 'pdf',
    description: 'รายงานสรุปสถานการณ์น้ำรูปแบบ PDF',
  },
];

const ReportUploadForm: React.FC = () => {
  const [type, setType] = useState('rpt');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const current = FILE_TYPES.find((t) => t.value === type)!;

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    setMessage(null);
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({
        type: 'error',
        text: 'กรุณาเลือกไฟล์ก่อนอัปโหลด',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    const form = new FormData();

    form.append('type', type);
    form.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/report/upload`, {
        method: 'POST',
        body: form,
      });

      const json = await res.json();

      if (!res.ok || json.status !== 'success') {
        throw new Error(
          json.message ||
            json.messages?.file ||
            'อัปโหลดไฟล์ไม่สำเร็จ'
        );
      }

      setMessage({
        type: 'success',
        text: `อัปโหลด ${json.data.file} สำเร็จ`,
      });

      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (e: any) {
      setMessage({
        type: 'error',
        text: e.message || 'เกิดข้อผิดพลาดในการอัปโหลด',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 'calc(100vh - 100px)',
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
        fontFamily: 'Prompt',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontFamily: 'Prompt',
            fontWeight: 700,
            fontSize: {
              xs: '1.35rem',
              md: '1.7rem',
            },
            color: 'text.primary',
            mb: 0.5,
          }}
        >
          อัปโหลดไฟล์รายงาน
        </Typography>

        <Typography
          sx={{
            fontFamily: 'Prompt',
            fontSize: '0.95rem',
            color: 'text.secondary',
          }}
        >
          อัปโหลดและจัดการไฟล์รายงานประจำวันเข้าสู่ระบบ
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(0, 1.5fr) minmax(300px, 1fr)',
          },
          gap: 3,
          width: '100%',
        }}
      >
        {/* Upload Section */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            p: {
              xs: 2,
              sm: 3,
              md: 4,
            },
            backgroundColor: 'background.paper',
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Prompt',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  mb: 0.5,
                }}
              >
                อัปโหลดไฟล์
              </Typography>

              <Typography
                sx={{
                  fontFamily: 'Prompt',
                  color: 'text.secondary',
                  fontSize: '0.85rem',
                }}
              >
                เลือกประเภทไฟล์และไฟล์ที่ต้องการนำเข้าสู่ระบบ
              </Typography>
            </Box>

            <Divider />

            {/* File Type */}
            <TextField
              select
              label="ประเภทไฟล์"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setFile(null);
                setMessage(null);

                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              fullWidth
              sx={{
                '& .MuiInputBase-root': {
                  fontFamily: 'Prompt',
                },
                '& .MuiInputLabel-root': {
                  fontFamily: 'Prompt',
                },
              }}
            >
              {FILE_TYPES.map((t) => (
                <MenuItem
                  key={t.value}
                  value={t.value}
                  sx={{
                    fontFamily: 'Prompt',
                    py: 1.2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: 'Prompt',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      }}
                    >
                      {t.label}
                    </Typography>

                    <Typography
                      sx={{
                        fontFamily: 'Prompt',
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                      }}
                    >
                      {t.filename}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            {/* Selected Type */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {current.type === 'pdf' ? (
                <PictureAsPdfIcon
                  sx={{
                    fontSize: 38,
                    color: 'error.main',
                  }}
                />
              ) : (
                <ImageIcon
                  sx={{
                    fontSize: 38,
                    color: 'primary.main',
                  }}
                />
              )}

              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontFamily: 'Prompt',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  {current.label}
                </Typography>

                <Typography
                  sx={{
                    fontFamily: 'Prompt',
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                  }}
                >
                  ชื่อไฟล์ที่ต้องการ: {current.filename}
                </Typography>
              </Box>

              <Chip
                label={current.type === 'pdf' ? 'PDF' : 'IMAGE'}
                size="small"
                sx={{
                  fontFamily: 'Prompt',
                  fontWeight: 600,
                }}
              />
            </Box>

            {/* Upload Area */}
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: file
                  ? 'success.main'
                  : 'primary.main',
                borderRadius: 3,
                minHeight: 190,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: '0.2s',
                px: 2,

                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.dark',
                },
              }}
            >
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept={current.accept}
                onChange={(e) =>
                  handleFileChange(
                    e.target.files?.[0] ?? null
                  )
                }
              />

              {file ? (
                <>
                  <CheckCircleIcon
                    sx={{
                      fontSize: 48,
                      color: 'success.main',
                      mb: 1,
                    }}
                  />

                  <Typography
                    sx={{
                      fontFamily: 'Prompt',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    {file.name}
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: 'Prompt',
                      color: 'text.secondary',
                      fontSize: '0.8rem',
                      mt: 0.5,
                    }}
                  >
                    {formatFileSize(file.size)}
                  </Typography>

                  <Button
                    size="small"
                    sx={{
                      mt: 1,
                      fontFamily: 'Prompt',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);

                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    เปลี่ยนไฟล์
                  </Button>
                </>
              ) : (
                <>
                  <CloudUploadIcon
                    sx={{
                      fontSize: 52,
                      color: 'primary.main',
                      mb: 1,
                    }}
                  />

                  <Typography
                    sx={{
                      fontFamily: 'Prompt',
                      fontWeight: 600,
                      fontSize: '1rem',
                    }}
                  >
                    คลิกเพื่อเลือกไฟล์
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: 'Prompt',
                      color: 'text.secondary',
                      fontSize: '0.8rem',
                      mt: 0.5,
                    }}
                  >
                    รองรับไฟล์ {current.type === 'pdf' ? 'PDF' : 'JPG, PNG'}
                  </Typography>
                </>
              )}
            </Box>

            {/* Progress */}
            {loading && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Prompt',
                      fontSize: '0.8rem',
                    }}
                  >
                    กำลังอัปโหลดไฟล์...
                  </Typography>
                </Box>

                <LinearProgress
                  sx={{
                    borderRadius: 2,
                    height: 6,
                  }}
                />
              </Box>
            )}

            {/* Message */}
            {message && (
              <Alert
                severity={message.type}
                sx={{
                  fontFamily: 'Prompt',
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontFamily: 'Prompt',
                  },
                }}
              >
                {message.text}
              </Alert>
            )}

            {/* Upload Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<CloudUploadIcon />}
              disabled={!file || loading}
              onClick={handleUpload}
              sx={{
                height: 50,
                borderRadius: 2,
                fontFamily: 'Prompt',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              {loading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์'}
            </Button>
          </Stack>
        </Paper>

        {/* Information Section */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            p: {
              xs: 2,
              sm: 3,
              md: 4,
            },
            height: 'fit-content',
            backgroundColor: 'background.paper',
          }}
        >
          <Stack spacing={3}>
            {/* Header */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <InfoOutlinedIcon color="primary" />

                <Typography
                  sx={{
                    fontFamily: 'Prompt',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                  }}
                >
                  วิธีการใช้งาน
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontFamily: 'Prompt',
                  color: 'text.secondary',
                  fontSize: '0.85rem',
                }}
              >
                ขั้นตอนการอัปโหลดรายงานเข้าสู่ระบบ
              </Typography>
            </Box>

            <Divider />

            {/* Steps */}
            <Stack spacing={2}>
              {[
                {
                  no: '1',
                  title: 'เลือกประเภทไฟล์',
                  description:
                    'เลือกประเภทของรายงานที่ต้องการอัปโหลดจากรายการ',
                },
                {
                  no: '2',
                  title: 'เลือกไฟล์',
                  description:
                    'เลือกไฟล์จากเครื่องคอมพิวเตอร์ของคุณ โดยต้องใช้ชื่อไฟล์ตามรูปแบบที่ระบบกำหนด',
                },
                {
                  no: '3',
                  title: 'ตรวจสอบไฟล์',
                  description:
                    'ตรวจสอบชื่อไฟล์และประเภทไฟล์ให้ถูกต้องก่อนดำเนินการ',
                },
                {
                  no: '4',
                  title: 'อัปโหลด',
                  description:
                    'กดปุ่ม "อัปโหลดไฟล์" เพื่อส่งไฟล์เข้าสู่ระบบ',
                },
              ].map((step) => (
                <Box
                  key={step.no}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 32,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Prompt',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}
                  >
                    {step.no}
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontFamily: 'Prompt',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      {step.title}
                    </Typography>

                    <Typography
                      sx={{
                        fontFamily: 'Prompt',
                        fontSize: '0.8rem',
                        color: 'text.secondary',
                        lineHeight: 1.6,
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>

            <Divider />

            {/* File Format */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                }}
              >
                <FolderOpenIcon color="primary" />

                <Typography
                  sx={{
                    fontFamily: 'Prompt',
                    fontWeight: 600,
                  }}
                >
                  รูปแบบไฟล์ที่รองรับ
                </Typography>
              </Box>

              <Stack spacing={1}>
                {FILE_TYPES.map((item) => (
                  <Box
                    key={item.value}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.2,
                      borderRadius: 2,
                      backgroundColor:
                        item.value === type
                          ? 'action.selected'
                          : 'transparent',
                    }}
                  >
                    {item.type === 'pdf' ? (
                      <PictureAsPdfIcon
                        sx={{
                          color: 'error.main',
                          fontSize: 22,
                        }}
                      />
                    ) : (
                      <ImageIcon
                        sx={{
                          color: 'primary.main',
                          fontSize: 22,
                        }}
                      />
                    )}

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: 'Prompt',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                        }}
                      >
                        {item.label}
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: 'Prompt',
                          fontSize: '0.72rem',
                          color: 'text.secondary',
                        }}
                      >
                        {item.filename}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Note */}
            <Alert
              severity="info"
              icon={<InfoOutlinedIcon />}
              sx={{
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontFamily: 'Prompt',
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                },
              }}
            >
              กรุณาตรวจสอบชื่อไฟล์และประเภทไฟล์ให้ตรงกับประเภทที่เลือก
              ก่อนอัปโหลด เพื่อให้ระบบสามารถจัดเก็บรายงานได้ถูกต้อง
            </Alert>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default ReportUploadForm;
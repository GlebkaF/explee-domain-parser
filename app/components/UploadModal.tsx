'use client';

import { useState } from 'react';
import { Modal, Stack, FileInput, Button, Alert, Grid, Card, Text, Box, Table, Badge, Code, Group } from '@mantine/core';
import { IconUpload, IconFile, IconCheck, IconAlertTriangle, IconX, IconDownload } from '@tabler/icons-react';

interface UploadStats {
  totalRows: number;
  inserted: number;
  duplicates: number;
  invalid: number;
}

interface DomainProcessingResult {
  originalDomain: string;
  cleanedDomain: string;
  status: 'success' | 'duplicate' | 'error';
  errorReason?: string;
}

interface UploadResponse {
  success: boolean;
  stats?: UploadStats;
  processingResults?: DomainProcessingResult[];
  error?: string;
}

interface UploadModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadModal({ opened, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/domains/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success && onSuccess) {
        // Даем время показать результат
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch {
      setResult({
        success: false,
        error: 'Ошибка при загрузке файла',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  const handleDownloadExample = () => {
    const exampleCsv = `domain
example.com
https://google.com
http://github.com
www.reddit.com
https://www.youtube.com/watch?v=123
openai.com
vercel.com
microsoft.com
apple.com
amazon.com`;

    const blob = new Blob([exampleCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'example-domains.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge color="green" leftSection={<IconCheck size={12} />} size="sm">Добавлен</Badge>;
      case 'duplicate':
        return <Badge color="yellow" leftSection={<IconAlertTriangle size={12} />} size="sm">Дубликат</Badge>;
      case 'error':
        return <Badge color="red" leftSection={<IconX size={12} />} size="sm">Ошибка</Badge>;
      default:
        return null;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Загрузка CSV с доменами"
      size="xl"
      centered
    >
      <Stack gap="md">
        <FileInput
          leftSection={<IconFile size={18} />}
          label="Выберите CSV файл"
          placeholder="Нажмите для выбора файла"
          accept=".csv"
          value={file}
          onChange={setFile}
          disabled={uploading}
        />

        <Box>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              Формат CSV файла:
            </Text>
            <Button
              variant="light"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={handleDownloadExample}
            >
              Скачать пример
            </Button>
          </Group>
          <Code block>
{`domain
example.com
https://google.com
http://github.com
www.reddit.com`}
          </Code>
          <Text size="xs" c="dimmed" mt="xs">
            ✨ Автоматически удаляются: <Code>https://</Code>, <Code>http://</Code>, <Code>www.</Code>, пути, порты
          </Text>
        </Box>

        <Button
          onClick={handleUpload}
          disabled={!file}
          loading={uploading}
          leftSection={<IconUpload size={18} />}
          size="md"
          fullWidth
        >
          Загрузить CSV
        </Button>

        {result && (
          <Stack gap="md">
            {result.success ? (
              <>
                <Alert icon={<IconCheck size={20} />} title="Файл успешно обработан" color="green">
                  <Grid mt="sm">
                    <Grid.Col span={6}>
                      <Card withBorder padding="sm">
                        <Text size="lg" fw={700} c="blue" ta="center">
                          {result.stats?.totalRows}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">
                          Всего строк
                        </Text>
                      </Card>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Card withBorder padding="sm">
                        <Text size="lg" fw={700} c="green" ta="center">
                          {result.stats?.inserted}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">
                          Добавлено
                        </Text>
                      </Card>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Card withBorder padding="sm">
                        <Text size="lg" fw={700} c="yellow" ta="center">
                          {result.stats?.duplicates}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">
                          Дубликатов
                        </Text>
                      </Card>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Card withBorder padding="sm">
                        <Text size="lg" fw={700} c="red" ta="center">
                          {result.stats?.invalid}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">
                          Невалидных
                        </Text>
                      </Card>
                    </Grid.Col>
                  </Grid>
                </Alert>

                {result.processingResults && result.processingResults.length > 0 && result.processingResults.length <= 20 && (
                  <Box style={{ maxHeight: '300px', overflow: 'auto' }}>
                    <Table striped highlightOnHover withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>№</Table.Th>
                          <Table.Th>Домен</Table.Th>
                          <Table.Th>Статус</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {result.processingResults.map((item, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>{index + 1}</Table.Td>
                            <Table.Td>
                              <Code>{item.originalDomain}</Code>
                            </Table.Td>
                            <Table.Td>
                              {getStatusBadge(item.status)}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Box>
                )}
              </>
            ) : (
              <Alert icon={<IconX size={20} />} title="Ошибка при обработке файла" color="red">
                {result.error}
              </Alert>
            )}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Modal, Stack, FileInput, Button, Alert, Grid, Card, Text, Box, Table, Badge, Code, Group, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconUpload, IconFile, IconCheck, IconAlertTriangle, IconX, IconDownload, IconTrash } from '@tabler/icons-react';

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
  existingUserQuery?: string;
}

export function UploadModal({ opened, onClose, onSuccess, existingUserQuery }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [userQuery, setUserQuery] = useState('');

  useEffect(() => {
    if (opened) {
      setUserQuery(existingUserQuery || '');
    }
  }, [opened, existingUserQuery]);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userQuery.trim()) {
        formData.append('userQuery', userQuery.trim());
      }

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
amazon.com
gleb.land`;

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
        <Group justify="space-between" align="flex-end">
          <FileInput
            leftSection={<IconFile size={18} />}
            label="Выберите CSV файл с доменами компаний"
            placeholder="Нажмите для выбора файла"
            accept=".csv"
            value={file}
            onChange={setFile}
            disabled={uploading}
            style={{ flex: 1 }}
          />
          <Button
            variant="light"
            size="sm"
            leftSection={<IconDownload size={14} />}
            onClick={handleDownloadExample}
            disabled={uploading}
          >
            Скачать пример
          </Button>
        </Group>

        <TextInput
          label="Что бы вы хотели узнать о компании?"
          placeholder="Например: legal имя компании, цены, контакты..."
          value={userQuery}
          onChange={(e) => setUserQuery(e.currentTarget.value)}
          disabled={uploading || !!existingUserQuery}
        />

        {existingUserQuery && (
          <Group gap="xs" align="flex-start">
            <Alert color="blue" icon={<IconAlertTriangle size={16} />} style={{ flex: 1 }}>
              <Text size="sm">
                Если компании уже загружены, то изменить вопрос нельзя. Если хотите изменить вопрос, очистите БД и задайте новый вопрос.
              </Text>
            </Alert>
            <Button
              variant="light"
              color="red"
              size="sm"
              leftSection={<IconTrash size={16} />}
              onClick={() => {
                modals.openConfirmModal({
                  title: 'Подтверждение очистки базы данных',
                  centered: true,
                  children: (
                    <Text size="sm">
                      ⚠️ Вы уверены, что хотите удалить ВСЕ домены из базы данных? Это действие необратимо!
                    </Text>
                  ),
                  labels: { confirm: 'Удалить все', cancel: 'Отмена' },
                  confirmProps: { color: 'red' },
                  onConfirm: async () => {
                    try {
                      const response = await fetch('/api/domains/clear', {
                        method: 'DELETE',
                      });

                      const result = await response.json();
                      
                      if (result.success) {
                        setUserQuery('');
                        handleClose();
                        if (onSuccess) {
                          onSuccess();
                        }
                      } else {
                        setResult({
                          success: false,
                          error: result.error || 'Ошибка при очистке базы данных',
                        });
                      }
                    } catch (error) {
                      console.error('Error clearing database:', error);
                      setResult({
                        success: false,
                        error: 'Ошибка при очистке базы данных',
                      });
                    }
                  },
                });
              }}
              disabled={uploading}
            >
              Очистить таблицу
            </Button>
          </Group>
        )}

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


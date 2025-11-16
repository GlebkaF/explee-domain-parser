'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Title, Text, Paper, Stack, Box, Group, Loader, Center, LoadingOverlay, Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconUpload } from '@tabler/icons-react';
import DomainsTable from './components/DomainsTable';
import { UploadModal } from './components/UploadModal';

interface Domain {
  id: number;
  domain: string;
  status: 'created' | 'queued' | 'running' | 'completed' | 'error';
  errorMessage: string | null;
  companyDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get('page')) || 1;
  
  const [data, setData] = useState<{
    domains: Domain[];
    total: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploadModalOpened, setUploadModalOpened] = useState(false);
  
  // Ссылка на интервал поллинга для перезапуска
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Функция загрузки данных
  const loadData = async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/domains/list?page=${page}`, { signal });
      const result = await response.json();
      
      if (result.success) {
        setData({
          domains: result.domains,
          total: result.total,
          totalPages: result.totalPages,
          startIndex: result.startIndex,
          endIndex: result.endIndex,
        });
      }
    } catch (error) {
      // Игнорируем ошибки отмены запроса
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Error loading domains:', error);
    } finally {
      setLoading(false);
    }
  };

  // Функция перезапуска поллинга
  const resetPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    if (abortControllerRef.current) {
      pollIntervalRef.current = setInterval(() => {
        loadData(abortControllerRef.current!.signal);
      }, 3000);
    }
  };

  // Начальная загрузка и поллинг
  useEffect(() => {
    // AbortController для отмены запросов при размонтировании
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setLoading(true);
    loadData(abortController.signal);

    // Запускаем поллинг
    resetPolling();

    return () => {
      // Отменяем все запросы при размонтировании или смене страницы
      abortController.abort();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      abortControllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Обработчик запуска агента
  const handleRunAgent = async (domainId: number) => {
    // Оптимистичное обновление статуса
    setData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        domains: prevData.domains.map(domain =>
          domain.id === domainId
            ? { ...domain, status: 'queued' as const }
            : domain
        ),
      };
    });

    // Перезапускаем поллинг чтобы дать серверу время обработать запрос
    resetPolling();

    try {
      const response = await fetch(`/api/domains/${domainId}/run-agent`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        modals.open({
          title: 'Ошибка',
          centered: true,
          children: (
            <Text size="sm">{result.error || 'Ошибка при запуске агента'}</Text>
          ),
        });
        // Откатываем оптимистичное обновление при ошибке
        await loadData();
      }
    } catch (error) {
      console.error('Error running agent:', error);
      modals.open({
        title: 'Ошибка',
        centered: true,
        children: <Text size="sm">Ошибка при запуске агента</Text>,
      });
      // Откатываем оптимистичное обновление при ошибке
      await loadData();
    }
  };

  // Обработчик перезапуска
  const handleRestart = async (domainId: number) => {
    // Оптимистичное обновление статуса
    setData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        domains: prevData.domains.map(domain =>
          domain.id === domainId
            ? { ...domain, status: 'queued' as const }
            : domain
        ),
      };
    });

    // Перезапускаем поллинг чтобы дать серверу время обработать запрос
    resetPolling();

    try {
      const response = await fetch(`/api/domains/${domainId}/restart`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        modals.open({
          title: 'Ошибка',
          centered: true,
          children: (
            <Text size="sm">{result.error || 'Ошибка при перезапуске'}</Text>
          ),
        });
        // Откатываем оптимистичное обновление при ошибке
        await loadData();
      }
    } catch (error) {
      console.error('Error restarting:', error);
      modals.open({
        title: 'Ошибка',
        centered: true,
        children: <Text size="sm">Ошибка при перезапуске</Text>,
      });
      // Откатываем оптимистичное обновление при ошибке
      await loadData();
    }
  };

  const handleUploadSuccess = () => {
    // Перезагружаем данные после успешной загрузки
    router.push('/');
    loadData(abortControllerRef.current?.signal);
  };

  return (
    <Box style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #c5cae9 100%)', minHeight: '100vh' }} py={60} px="md">
      <Container size="xl">
        <Paper shadow="xl" p="xl" radius="lg">
          <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
              <Box>
                <Title order={1} size="h1" mb="sm">
                  🌐 Domain Parser
                </Title>
                {data && (
                  <Text size="lg" c="dimmed">
                    Всего доменов: <Text component="span" fw={600}>{data.total}</Text>
                  </Text>
                )}
              </Box>
              <Button
                leftSection={<IconUpload size={18} />}
                onClick={() => setUploadModalOpened(true)}
                size="lg"
              >
                Загрузить CSV
              </Button>
            </Group>

            {loading && !data ? (
              <Center py={60}>
                <Stack align="center" gap="md">
                  <Loader size="lg" />
                  <Text c="dimmed">Загрузка...</Text>
                </Stack>
              </Center>
            ) : data ? (
              data.total === 0 ? (
                <Center py={60}>
                  <Stack align="center" gap="md">
                    <Text size="xl">📭</Text>
                    <Title order={2} size="h3">Нет доменов</Title>
                    <Text c="dimmed">Загрузите CSV файл с доменами для начала работы</Text>
                    <Button
                      leftSection={<IconUpload size={18} />}
                      onClick={() => setUploadModalOpened(true)}
                      size="md"
                    >
                      Загрузить CSV
                    </Button>
                  </Stack>
                </Center>
              ) : (
                <Box pos="relative">
                  <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
                  <DomainsTable
                    domains={data.domains}
                    page={page}
                    totalPages={data.totalPages}
                    total={data.total}
                    startIndex={data.startIndex}
                    endIndex={data.endIndex}
                    onRunAgent={handleRunAgent}
                    onRestart={handleRestart}
                  />
                </Box>
              )
            ) : (
              <Center py={60}>
                <Text c="red">Ошибка загрузки данных</Text>
              </Center>
            )}
          </Stack>
        </Paper>
      </Container>

      <UploadModal
        opened={uploadModalOpened}
        onClose={() => setUploadModalOpened(false)}
        onSuccess={handleUploadSuccess}
      />
    </Box>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <Box style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #c5cae9 100%)', minHeight: '100vh' }} py={60} px="md">
        <Container size="xl">
          <Paper shadow="xl" p="xl" radius="lg">
            <Center py={60}>
              <Stack align="center" gap="md">
                <Loader size="lg" />
                <Text c="dimmed">Загрузка...</Text>
              </Stack>
            </Center>
          </Paper>
        </Container>
      </Box>
    }>
      <HomeContent />
    </Suspense>
  );
}

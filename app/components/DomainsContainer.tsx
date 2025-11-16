'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Stack, Text, Center, Loader, LoadingOverlay, Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconUpload } from '@tabler/icons-react';
import DomainsTable from './DomainsTable';

interface Domain {
  id: number;
  domain: string;
  status: 'created' | 'queued' | 'running' | 'completed' | 'error';
  errorMessage: string | null;
  companyDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DomainsContainerProps {
  onOpenUpload: () => void;
}

export default function DomainsContainer({ onOpenUpload }: DomainsContainerProps) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  
  const [data, setData] = useState<{
    domains: Domain[];
    total: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  
  // Ссылка на интервал поллинга для перезапуска
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Функция загрузки данных
  const loadData = useCallback(async (signal?: AbortSignal) => {
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
  }, [page]);

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


  if (loading && !data) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Загрузка...</Text>
        </Stack>
      </Center>
    );
  }

  if (!data) {
    return (
      <Center h={400}>
        <Text c="red">Ошибка загрузки данных</Text>
      </Center>
    );
  }

  if (data.total === 0) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Text size="xl">📭</Text>
          <Text size="h3" fw={600}>Нет доменов</Text>
          <Text c="dimmed">Загрузите CSV файл с доменами для начала работы</Text>
          <Button
            leftSection={<IconUpload size={18} />}
            onClick={onOpenUpload}
            size="md"
          >
            Загрузить CSV
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
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
    </div>
  );
}



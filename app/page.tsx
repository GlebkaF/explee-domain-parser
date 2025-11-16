'use client';

import { useState, Suspense } from 'react';
import { AppShell, Title, Text, Stack, Group, Loader, Center, Button, Menu } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconTools, IconTrash, IconPlayerPlay } from '@tabler/icons-react';
import DomainsContainer, { reloadDomains } from './components/DomainsContainer';
import { UploadModal } from './components/UploadModal';

function HomeContent() {
  const [uploadModalOpened, setUploadModalOpened] = useState(false);

  const handleUploadSuccess = () => {
    // Перезагружаем данные после успешной загрузки
    reloadDomains();
  };

  // Обработчик очистки БД
  const handleClearDatabase = () => {
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
            notifications.show({
              title: 'Успешно',
              message: `База данных очищена. Удалено доменов: ${result.deletedCount}`,
              color: 'green',
            });
            reloadDomains();
          } else {
            notifications.show({
              title: 'Ошибка',
              message: result.message || 'Ошибка при очистке базы данных',
              color: 'red',
            });
          }
        } catch (error) {
          console.error('Error clearing database:', error);
          notifications.show({
            title: 'Ошибка',
            message: 'Ошибка при очистке базы данных',
            color: 'red',
          });
        }
      },
    });
  };

  // Обработчик запуска обработки очереди
  const handleProcessQueue = async () => {
    try {
      notifications.show({
        title: 'Запуск обработки',
        message: 'Обработка очереди доменов запущена',
        color: 'blue',
      });

      const response = await fetch('/api/cron/process-domains', {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.processed === 0) {
          notifications.show({
            title: 'Информация',
            message: 'Нет доменов в очереди',
            color: 'blue',
          });
        } else {
          notifications.show({
            title: 'Успешно',
            message: result.domain 
              ? `Домен ${result.domain} успешно обработан`
              : 'Домен успешно обработан',
            color: 'green',
          });
          reloadDomains();
        }
      } else {
        notifications.show({
          title: 'Ошибка',
          message: result.message || 'Ошибка при обработке',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      notifications.show({
        title: 'Ошибка',
        message: 'Ошибка при запуске обработки очереди',
        color: 'red',
      });
    }
  };

  return (
    <AppShell header={{ height: 70 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={2}>🌐 Domain Parser</Title>
          <Group>
            <Button
              leftSection={<IconUpload size={18} />}
              onClick={() => setUploadModalOpened(true)}
            >
              Загрузить CSV
            </Button>
            <Menu shadow="md" width={250}>
              <Menu.Target>
                <Button variant="light" leftSection={<IconTools size={18} />}>
                  Инструменты
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Управление</Menu.Label>
                <Menu.Item
                  leftSection={<IconPlayerPlay size={16} />}
                  onClick={handleProcessQueue}
                >
                  Запустить обработку очереди
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>Опасная зона</Menu.Label>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={handleClearDatabase}
                >
                  Очистить базу данных
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <DomainsContainer onOpenUpload={() => setUploadModalOpened(true)} />
      </AppShell.Main>

      <UploadModal
        opened={uploadModalOpened}
        onClose={() => setUploadModalOpened(false)}
        onSuccess={handleUploadSuccess}
      />
    </AppShell>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <AppShell header={{ height: 70 }} padding="md">
        <AppShell.Header>
          <Group h="100%" px="md">
            <Title order={2}>🌐 Domain Parser</Title>
          </Group>
        </AppShell.Header>
        <AppShell.Main>
          <Center h={400}>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">Загрузка...</Text>
            </Stack>
          </Center>
        </AppShell.Main>
      </AppShell>
    }>
      <HomeContent />
    </Suspense>
  );
}

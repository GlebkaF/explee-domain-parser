'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Paper, Title, TextInput, Button, Stack, Text, Alert } from '@mantine/core';
import { IconLock, IconAlertCircle } from '@tabler/icons-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Загружаем сохраненный пароль из localStorage
    const savedPassword = localStorage.getItem('auth_password');
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Сохраняем пароль в localStorage
      localStorage.setItem('auth_password', password);

      // Делаем тестовый запрос с паролем в заголовке
      const response = await fetch('/', {
        method: 'GET',
        headers: {
          'x-password': password,
        },
      });

      if (response.ok && !response.redirected) {
        // Успешная авторизация, cookie установлен сервером, редирект на главную
        router.push('/');
        router.refresh();
      } else {
        setError('Неверный пароль');
        localStorage.removeItem('auth_password');
      }
    } catch {
      setError('Ошибка при авторизации');
      localStorage.removeItem('auth_password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={100}>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Stack gap="md">
          <div>
            <Title order={2} ta="center" mb="xs">
              🌐 Domain Parser
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Введите пароль для входа
            </Text>
          </div>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Ошибка" color="red">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Пароль"
                type="password"
                placeholder="Введите пароль"
                leftSection={<IconLock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />

              <Button type="submit" fullWidth loading={loading}>
                Войти
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}

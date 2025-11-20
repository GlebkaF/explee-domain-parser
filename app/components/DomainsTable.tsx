'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Badge, Button, Text, Group, Stack, Anchor, Pagination, TextInput, Modal } from '@mantine/core';
import { IconRocket, IconRefresh } from '@tabler/icons-react';

interface Domain {
  id: number;
  domain: string;
  status: 'created' | 'queued' | 'running' | 'completed' | 'error';
  errorMessage: string | null;
  companyDescription: string | null;
  userQuery: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DomainsTableProps {
  domains: Domain[];
  page: number;
  totalPages: number;
  total: number;
  startIndex: number;
  endIndex: number;
  onRunAgent: (domainId: number, userQuery: string) => Promise<void>;
  onRestart: (domainId: number) => Promise<void>;
}

const STATUS_CONFIG = {
  created: {
    label: 'Создан',
    color: 'gray' as const,
  },
  queued: {
    label: 'В очереди',
    color: 'blue' as const,
  },
  running: {
    label: 'Выполняется',
    color: 'yellow' as const,
  },
  completed: {
    label: 'Завершен',
    color: 'green' as const,
  },
  error: {
    label: 'Ошибка',
    color: 'red' as const,
  },
};

export default function DomainsTable({
  domains,
  page,
  totalPages,
  total,
  startIndex,
  endIndex,
  onRunAgent,
  onRestart,
}: DomainsTableProps) {
  const router = useRouter();
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [queryInput, setQueryInput] = useState('');

  const handlePageChange = (newPage: number) => {
    router.push(`/?page=${newPage}`);
  };

  const handleRunAgentClick = (domainId: number) => {
    setSelectedDomainId(domainId);
    setQueryInput('');
    setModalOpened(true);
  };

  const handleConfirm = async () => {
    if (selectedDomainId && queryInput.trim()) {
      await onRunAgent(selectedDomainId, queryInput.trim());
      setModalOpened(false);
      setQueryInput('');
      setSelectedDomainId(null);
    }
  };

  const handleCancel = () => {
    setModalOpened(false);
    setQueryInput('');
    setSelectedDomainId(null);
  };

  return (
    <>
      <Modal
        opened={modalOpened}
        onClose={handleCancel}
        title="Запрос к агенту"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Что вы хотели бы узнать о компании?
          </Text>
          <TextInput
            placeholder="Например: legal имя компании, цены, контакты..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.currentTarget.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && queryInput.trim()) {
                handleConfirm();
              }
            }}
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={handleCancel}
            >
              Отмена
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!queryInput.trim()}
            >
              Запустить
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Stack gap="md">
        {/* Stats */}
        {total > 0 && (
          <Text size="sm" c="dimmed">
            Показано {startIndex}-{endIndex} из {total}
          </Text>
        )}

      {/* Table */}
      <Table.ScrollContainer minWidth={1000}>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Домен</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th>Запрос</Table.Th>
              <Table.Th>Ответ</Table.Th>
              <Table.Th>Дата создания</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {domains.map((domain) => {
              const statusConfig = STATUS_CONFIG[domain.status] || STATUS_CONFIG.created;
              const canRunAgent = domain.status === 'created';
              const canRestart = domain.status === 'running' || domain.status === 'error';

              return (
                <Table.Tr key={domain.id}>
                  <Table.Td>{domain.id}</Table.Td>
                  <Table.Td>
                    <Anchor
                      href={`https://${domain.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                    >
                      {domain.domain}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Badge color={statusConfig.color} variant="light">
                        {statusConfig.label}
                      </Badge>
                    </Group>
                    {domain.errorMessage && (
                      <Text size="xs" c="red" mt={4}>
                        {domain.errorMessage}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {domain.userQuery ? (
                      <Text size="sm" lineClamp={2} style={{ maxWidth: 300 }}>
                        {domain.userQuery}
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed">
                        —
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {domain.companyDescription ? (
                      <Text size="sm" lineClamp={3} style={{ maxWidth: 400 }}>
                        {domain.companyDescription}
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed">
                        —
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {new Date(domain.createdAt).toLocaleString('ru-RU', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {canRestart ? (
                      <Button
                        onClick={() => onRestart(domain.id)}
                        disabled={!canRestart}
                        size="xs"
                        color="orange"
                        leftSection={<IconRefresh size={14} />}
                      >
                        Перезапустить
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRunAgentClick(domain.id)}
                        disabled={!canRunAgent}
                        size="xs"
                        leftSection={<IconRocket size={14} />}
                      >
                        Run Agent
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center" mt="xl">
          <Pagination
            total={totalPages}
            value={page}
            onChange={handlePageChange}
            siblings={1}
            boundaries={1}
          />
        </Group>
      )}
      </Stack>
    </>
  );
}

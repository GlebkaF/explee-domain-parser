'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Badge, Button, Text, Group, Stack, Box, Anchor, ActionIcon, Pagination, Paper, Collapse } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconRocket, IconRefresh, IconChevronDown, IconChevronRight, IconCopy } from '@tabler/icons-react';

interface Domain {
  id: number;
  domain: string;
  status: 'created' | 'queued' | 'running' | 'completed' | 'error';
  errorMessage: string | null;
  companyDescription: string | null;
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
  onRunAgent: (domainId: number) => Promise<void>;
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
  const clipboard = useClipboard();
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set());

  const toggleExpanded = (domainId: number) => {
    setExpandedDomains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domainId)) {
        newSet.delete(domainId);
      } else {
        newSet.add(domainId);
      }
      return newSet;
    });
  };

  const handleCopyDescription = (description: string) => {
    clipboard.copy(description);
    notifications.show({
      title: 'Скопировано!',
      message: 'Описание компании скопировано в буфер обмена',
      color: 'green',
    });
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/?page=${newPage}`);
  };

  return (
    <Stack gap="md">
      {/* Stats */}
      {total > 0 && (
        <Text size="sm" c="dimmed">
          Показано {startIndex}-{endIndex} из {total}
        </Text>
      )}

      {/* Table */}
      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Домен</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th>Дата создания</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {domains.map((domain) => {
              const statusConfig = STATUS_CONFIG[domain.status] || STATUS_CONFIG.created;
              const canRunAgent = domain.status === 'created';
              const canRestart = domain.status === 'running' || domain.status === 'error';
              const isExpanded = expandedDomains.has(domain.id);
              const hasDescription = domain.status === 'completed' && domain.companyDescription;

              return (
                <React.Fragment key={domain.id}>
                  <Table.Tr>
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
                        {hasDescription && (
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => toggleExpanded(domain.id)}
                          >
                            {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                          </ActionIcon>
                        )}
                      </Group>
                      {domain.errorMessage && (
                        <Text size="xs" c="red" mt={4}>
                          {domain.errorMessage}
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
                          onClick={() => onRunAgent(domain.id)}
                          disabled={!canRunAgent}
                          size="xs"
                          leftSection={<IconRocket size={14} />}
                        >
                          Run Agent
                        </Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                  {hasDescription && (
                    <Table.Tr>
                      <Table.Td colSpan={5} p={0}>
                        <Collapse in={isExpanded}>
                          <Paper p="md" bg="gray.0">
                            <Stack gap="sm">
                              <Group justify="space-between">
                                <Text size="sm" fw={600}>
                                  🏢 Описание компании
                                </Text>
                                <Button
                                  size="xs"
                                  variant="light"
                                  leftSection={<IconCopy size={14} />}
                                  onClick={() => handleCopyDescription(domain.companyDescription || '')}
                                >
                                  Копировать
                                </Button>
                              </Group>
                              <Paper withBorder p="sm">
                                <Text size="sm">
                                  {domain.companyDescription}
                                </Text>
                              </Paper>
                            </Stack>
                          </Paper>
                        </Collapse>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </React.Fragment>
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
  );
}

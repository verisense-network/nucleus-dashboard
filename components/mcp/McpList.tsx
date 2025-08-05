'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@heroui/react';
import McpCard from './McpCard';
import { McpServer } from '@/types/mcp';
import { getMcpServerList } from '@/app/actions';
import { ENDPOINT } from '@/config/endpoint';

interface McpListProps {
  showLinks?: boolean;
  className?: string;
}

export default function McpList({ showLinks = true, className = '' }: McpListProps) {
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMcpServers() {
      try {
        setLoading(true);
        setError(null);
        const response = await getMcpServerList(ENDPOINT);

        if (response.success && response.data) {
          setMcpServers(response.data);
        } else {
          setError(response.message || 'Failed to load MCP servers');
        }
      } catch (err) {
        setError('Error loading MCP servers');
        console.error('Error loading MCP servers:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMcpServers();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-default-600">Loading MCP servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-default-600">{error}</p>
        </div>
      </div>
    );
  }

  if (mcpServers.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-default-500">No MCP Servers</h2>
          <p className="text-default-600">No MCP servers are currently available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-2xl font-bold mb-6">MCP Servers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mcpServers.map((server) => (
          <McpCard
            key={server.id}
            mcpServer={server}
            showLink={showLinks}
          />
        ))}
      </div>
    </div>
  );
}

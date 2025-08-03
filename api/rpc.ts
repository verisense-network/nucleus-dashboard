import { getPolkadotApi } from "@/lib/polkadotApi";
import { AgentCard } from "@/types/a2a";
import { McpServer } from "@/types/mcp";
import { Id, toast } from "react-toastify";

export async function registerAgent(endpoint: string, agentCard: AgentCard, toastId: Id, updateAgentId?: string | null): Promise<string> {
  const [
    { setupSigner },
    { usePolkadotWalletStore },
  ] = await Promise.all([
    import("@/utils/polkadot-signer"),
    import("@/stores/polkadot-wallet"),
  ]);

  const api = await getPolkadotApi(endpoint);
  await setupSigner(api);

  const extrinsic = updateAgentId ? api.tx.a2a.update(updateAgentId, agentCard) : api.tx.a2a.register(agentCard);

  const account = usePolkadotWalletStore.getState().selectedAccount;

  if (!account) {
    throw new Error('please connect wallet and select account');
  }

  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(account.address, (result) => {
      if (result.status.isInBlock) {
        toast.update(toastId, {
          type: 'info',
          render: 'Transaction included in block...',
          isLoading: true,
          autoClose: false,
        });
        console.log('transaction included in block:', result.status.asInBlock.toHex());
      } else if (result.status.isFinalized) {
        toast.update(toastId, {
          type: 'success',
          render: 'Transaction finalized!',
          isLoading: false,
        });
        console.log('transaction finalized:', result.status.asFinalized.toHex());
        resolve(result.status.asFinalized.toHex());
      }

      if (result.dispatchError) {
        if (result.dispatchError.isModule) {
          const decoded = api.registry.findMetaError(result.dispatchError.asModule);
          const { docs, method, section } = decoded;
          console.error(`module error: ${section}.${method}: ${docs.join(' ')}`);
          reject(new Error(`transaction failed: ${section}.${method}: ${docs.join(' ')}`));
        } else {
          console.error('transaction error:', result.dispatchError.toString());
          reject(new Error(`transaction failed: ${result.dispatchError.toString()}`));
        }
      }
    }).catch((error) => {
      console.error('sign or send transaction failed:', error);
      reject(new Error(`sign or send transaction failed: ${error.message}`));
    });
  });
}


export async function deleteAgent(endpoint: string, agentId: string, toastId: Id): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('agentRegister can only be called in client environment');
  }

  const [
    { setupSigner },
    { usePolkadotWalletStore },
  ] = await Promise.all([
    import("@/utils/polkadot-signer"),
    import("@/stores/polkadot-wallet"),
  ]);

  const api = await getPolkadotApi(endpoint);
  await setupSigner(api);

  const extrinsic = api.tx.a2a.deregister(agentId);

  const account = usePolkadotWalletStore.getState().selectedAccount;

  if (!account) {
    throw new Error('please connect wallet and select account');
  }

  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(account.address, (result) => {
      if (result.status.isFinalized) {
        toast.update(toastId, {
          type: 'success',
          render: 'Agent deleted!',
          isLoading: false,
        });
        console.log('agent deleted:', result.status.asFinalized.toHex());
        resolve(result.status.asFinalized.toHex());
      }

      if (result.dispatchError) {
        if (result.dispatchError.isModule) {
          const decoded = api.registry.findMetaError(result.dispatchError.asModule);
          const { docs, method, section } = decoded;
          console.error(`module error: ${section}.${method}: ${docs.join(' ')}`);
          reject(new Error(`transaction failed: ${section}.${method}: ${docs.join(' ')}`));
        } else {
          console.error('transaction error:', result.dispatchError.toString());
          reject(new Error(`transaction failed: ${result.dispatchError.toString()}`));
        }
      }
    }).catch((error) => {
      console.error('sign or send transaction failed:', error);
      reject(new Error(`sign or send transaction failed: ${error.message}`));
    });
  });
}

export async function getAgentListAPI(endpoint: string): Promise<AgentCard[]> {
  const api = await getPolkadotApi(endpoint);

  const result = await api.call.a2aRuntimeApi?.getAllAgents();
  if (!result) {
    throw new Error('A2A runtime API not available or getAllAgents method not found');
  }
  return result.toHuman() as unknown as AgentCard[];
}

export async function getAgentByIdAPI(endpoint: string, agentId: string): Promise<AgentCard> {
  const api = await getPolkadotApi(endpoint);
  const result = await api.call.a2aRuntimeApi?.findAgent(agentId);
  if (!result) {
    throw new Error('A2A runtime API not available or findAgent method not found');
  }
  return result.toHuman() as unknown as AgentCard;
}

export async function getMcpServerListAPI(endpoint: string): Promise<McpServer[]> {
  const api = await getPolkadotApi(endpoint);
  const entries = await api.query.mcp.servers.entries();

  const servers = entries.map(([key, value]) => {
    const serverId = key.args[0].toString();

    const serverInfo = value.toHuman() as unknown;
    const typedServerInfo = serverInfo as {
      name: string;
      description: string;
      url: string;
      provider: string;
    };

    return {
      id: serverId,
      name: typedServerInfo.name,
      description: typedServerInfo.description,
      url: typedServerInfo.url,
      provider: typedServerInfo.provider,
    } as McpServer;
  });

  return servers;
}

export async function getMcpServerByIdAPI(endpoint: string, serverId: string): Promise<McpServer> {
  const api = await getPolkadotApi(endpoint);
  const result = await api.query.mcp.servers(serverId);

  const humanResult = result.toHuman();
  if (!humanResult) {
    throw new Error(`MCP server with ID ${serverId} not found`);
  }

  const typedServerInfo = humanResult as {
    name: string;
    description: string;
    url: string;
    provider: string;
  };

  return {
    id: serverId,
    name: typedServerInfo.name,
    description: typedServerInfo.description,
    url: typedServerInfo.url,
    provider: typedServerInfo.provider,
  } as McpServer;
}

export async function registerMcp(endpoint: string, mcpServer: McpServer, toastId: Id): Promise<string> {
  const [
    { setupSigner },
    { usePolkadotWalletStore },
  ] = await Promise.all([
    import("@/utils/polkadot-signer"),
    import("@/stores/polkadot-wallet"),
  ]);

  const api = await getPolkadotApi(endpoint);
  await setupSigner(api);

  const extrinsic = api.tx.mcp.register(mcpServer.name, mcpServer.description, mcpServer.url);

  const account = usePolkadotWalletStore.getState().selectedAccount;

  if (!account) {
    throw new Error('please connect wallet and select account');
  }

  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(account.address, (result) => {
      if (result.status.isInBlock) {
        toast.update(toastId, {
          type: 'info',
          render: 'Transaction included in block...',
          isLoading: true,
          autoClose: false,
        });
        console.log('transaction included in block:', result.status.asInBlock.toHex());
      } else if (result.status.isFinalized) {
        toast.update(toastId, {
          type: 'success',
          render: 'MCP server registered successfully!',
          isLoading: false,
        });
        console.log('transaction finalized:', result.status.asFinalized.toHex());
        resolve(result.status.asFinalized.toHex());
      }

      if (result.dispatchError) {
        if (result.dispatchError.isModule) {
          const decoded = api.registry.findMetaError(result.dispatchError.asModule);
          const { docs, method, section } = decoded;
          console.error(`module error: ${section}.${method}: ${docs.join(' ')}`);
          reject(new Error(`transaction failed: ${section}.${method}: ${docs.join(' ')}`));
        } else {
          console.error('transaction error:', result.dispatchError.toString());
          reject(new Error(`transaction failed: ${result.dispatchError.toString()}`));
        }
      }
    }).catch((error) => {
      console.error('sign or send transaction failed:', error);
      reject(new Error(`sign or send transaction failed: ${error.message}`));
    });
  });
}

export async function deregisterMcp(endpoint: string, serverId: string, toastId: Id): Promise<string> {
  const [
    { setupSigner },
    { usePolkadotWalletStore },
  ] = await Promise.all([
    import("@/utils/polkadot-signer"),
    import("@/stores/polkadot-wallet"),
  ]);

  const api = await getPolkadotApi(endpoint);
  await setupSigner(api);

  const extrinsic = api.tx.mcp.deregister(serverId);

  const account = usePolkadotWalletStore.getState().selectedAccount;

  if (!account) {
    throw new Error('please connect wallet and select account');
  }

  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(account.address, (result) => {
      if (result.status.isFinalized) {
        toast.update(toastId, {
          type: 'success',
          render: 'MCP server deregistered successfully!',
          isLoading: false,
        });
        console.log('MCP server deregistered:', result.status.asFinalized.toHex());
        resolve(result.status.asFinalized.toHex());
      }

      if (result.dispatchError) {
        if (result.dispatchError.isModule) {
          const decoded = api.registry.findMetaError(result.dispatchError.asModule);
          const { docs, method, section } = decoded;
          console.error(`module error: ${section}.${method}: ${docs.join(' ')}`);
          reject(new Error(`transaction failed: ${section}.${method}: ${docs.join(' ')}`));
        } else {
          console.error('transaction error:', result.dispatchError.toString());
          reject(new Error(`transaction failed: ${result.dispatchError.toString()}`));
        }
      }
    }).catch((error) => {
      console.error('sign or send transaction failed:', error);
      reject(new Error(`sign or send transaction failed: ${error.message}`));
    });
  });
}


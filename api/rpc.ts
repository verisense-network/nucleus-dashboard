import { getPolkadotApi } from "@/lib/polkadotApi";
import { AgentCard } from "@/types/a2a";
import { McpServer } from "@/types/mcp";
import { Id, toast } from "react-toastify";
import { compressString, decompressString } from "@/utils/compressString";
import { AgentInfo } from "@/app/actions";

function processDescriptionFromChain(description?: string): string {
  if (description?.startsWith('0x') && description.length > 10) {
    try {
      const hexString = description.slice(2);
      const compressed = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      return decompressString(compressed);
    } catch (error) {
      console.error('Failed to decompress description:', error);
      return description;
    }
  }
  return description || "";
}

export async function registerAgent(endpoint: string, agentCard: AgentCard, priceRate: number | undefined, toastId: Id, updateAgentId?: string | null): Promise<string> {
  const [
    { setupSigner },
    { usePolkadotWalletStore },
  ] = await Promise.all([
    import("@/utils/polkadot-signer"),
    import("@/stores/polkadot-wallet"),
  ]);

  const api = await getPolkadotApi(endpoint);
  await setupSigner(api);

  const extrinsic = updateAgentId
    ? api.tx.a2a.update(updateAgentId, agentCard, priceRate)
    : api.tx.a2a.register(agentCard, priceRate);

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

export async function getAgentListAPI(endpoint: string): Promise<AgentInfo[]> {
  const api = await getPolkadotApi(endpoint);

  const result = await api.call.a2aRuntimeApi?.getAllAgents();
  if (!result) {
    throw new Error('A2A runtime API not available or getAllAgents method not found');
  }

  const agents = result.toHuman() as unknown as AgentInfo[];

  return agents.map(agent => {
    const processedAgent: AgentInfo = {
      ...agent,
      priceRate: agent.priceRate ?
        (typeof agent.priceRate === 'string' ?
          parseInt(agent.priceRate.replace(/,/g, ''), 10) / 100 :
          Number(agent.priceRate) / 100).toString() :
        undefined,
    };

    if (agent.agentCard?.description) {
      processedAgent.agentCard = {
        ...agent.agentCard,
        description: processDescriptionFromChain(agent.agentCard.description),
      };
    }

    return processedAgent;
  });
}

export async function getAgentByIdAPI(endpoint: string, agentId: string): Promise<AgentInfo> {
  const api = await getPolkadotApi(endpoint);
  const result = await api.call.a2aRuntimeApi?.findAgent(agentId);
  if (!result) {
    throw new Error('A2A runtime API not available or findAgent method not found');
  }

  const agent = result.toHuman() as unknown as AgentInfo;

  const processedAgent: AgentInfo = {
    ...agent,
    priceRate: agent.priceRate ?
      (typeof agent.priceRate === 'string' ?
        parseInt(agent.priceRate.replace(/,/g, ''), 10) / 100 :
        Number(agent.priceRate) / 100).toString() :
      undefined,
  };

  if (agent.agentCard?.description) {
    processedAgent.agentCard = {
      ...agent.agentCard,
      description: processDescriptionFromChain(agent.agentCard.description),
    };
  }

  return processedAgent;
}

export async function getMcpServerListAPI(endpoint: string): Promise<McpServer[]> {
  const api = await getPolkadotApi(endpoint);
  const result = await api.call.mcpRuntimeApi?.getAllMcpServers();
  if (!result) {
    throw new Error('MCP runtime API not available or getAllAgents method not found');
  }

  const mcps = result.toHuman() as unknown as [string, Omit<McpServer, "id">][];

  return mcps.map(([key, value]) => {
    const serverId = key;
    const serverInfo = value;
    const typedServerInfo = serverInfo as {
      name: string;
      description: string;
      url: string;
      provider: string;
      priceRate?: number | string;
      logo?: string;
      providerWebsite?: string;
      providerName?: string;
      urlVerified: boolean;
    };

    return {
      id: serverId,
      name: typedServerInfo.name,
      description: processDescriptionFromChain(typedServerInfo.description),
      url: typedServerInfo.url,
      provider: typedServerInfo.provider,
      priceRate: typedServerInfo.priceRate ?
        (typeof typedServerInfo.priceRate === 'string' ?
          parseInt(typedServerInfo.priceRate.replace(/,/g, ''), 10) / 100 :
          typedServerInfo.priceRate / 100) :
        undefined,
      logo: typedServerInfo.logo,
      providerWebsite: typedServerInfo.providerWebsite,
      providerName: typedServerInfo.providerName,
      urlVerified: typedServerInfo.urlVerified,
    } as McpServer;
  });
}

export async function getMcpServerByIdAPI(endpoint: string, serverId: string): Promise<McpServer> {
  const api = await getPolkadotApi(endpoint);
  console.log("serverId", serverId)
  const result = await api.call.mcpRuntimeApi?.findMcpServer(serverId);

  if (!result) {
    throw new Error(`MCP server with ID ${serverId} not found`);
  }

  const mcp = result.toHuman() as unknown as McpServer;

  console.log("mcp", mcp)

  const processedMcp: McpServer = {
    ...mcp,
    priceRate: mcp.priceRate ?
      (typeof mcp.priceRate === 'string' ?
        parseInt(mcp.priceRate.replace(/,/g, ''), 10) / 100 :
        Number(mcp.priceRate) / 100).toString() :
      undefined,
  };

  return processedMcp
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

  const maxDescriptionLength = 256;
  let processedDescription = mcpServer.description;

  if (new TextEncoder().encode(mcpServer.description).length > maxDescriptionLength) {
    const compressed = compressString(mcpServer.description);
    processedDescription = `0x${Array.from(compressed).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }

  const extrinsic = api.tx.mcp.register(
    mcpServer.name,
    processedDescription,
    mcpServer.url,
    mcpServer.priceRate || null,
    mcpServer.logo || null,
    mcpServer.providerWebsite || null,
    mcpServer.providerName || null
  );

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


"use client";

import { Card, CardBody } from "@heroui/card";
import AgentCard from "./components/AgentCard";
import { Button, Chip, Pagination as PaginationComponent, Switch } from "@heroui/react";
import Link from "next/link";
import { AgentInfo, getAgentList } from "@/app/actions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEndpointStore } from "@/stores/endpoint";
import { cn, Input, Spinner } from "@heroui/react";
import { wrapApiRequest } from "@/utils/api";
import { getAgentListAPI } from "@/api/rpc";
import { Search } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Grid, Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/grid';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { usePolkadotWalletStore } from "../connectWallet";

export const ListboxWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full px-1 py-2 rounded-small">{children}</div>
);

export default function AgentList() {
  const { endpoint, status: endpointStatus, isLocalNode } = useEndpointStore();
  const { selectedAddress } = usePolkadotWalletStore();
  const [agentList, setAgentList] = useState<AgentInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [showMyAgentsOnly, setShowMyAgentsOnly] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    const fetchAgentList = async () => {
      if (endpointStatus !== "connected") {
        return;
      }

      try {
        setIsLoading(true);
        const result = await wrapApiRequest(getAgentList.bind(null, endpoint), getAgentListAPI.bind(null, endpoint), isLocalNode(endpoint));

        if (!result.success) {
          setError(result.message || "Unknown error");
          return;
        }

        if (result.data) {
          setAgentList(result.data);
        }
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgentList();
  }, [endpoint, endpointStatus, isLocalNode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getGridHeight = (length: number): string => {
    const heights = ["min-h-[150px] h-[10vh]", "min-h-[260px] h-[20vh]", "min-h-[380px] h-[35vh]", "min-h-[600px] h-[50vh]"];
    const thresholds = [1, 3, 5, 7];

    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (length >= thresholds[i]) {
        return heights[i];
      }
    }
    return heights[0];
  };

  const filteredAgentList = useMemo(() => {
    let filtered = agentList;

    if (showMyAgentsOnly && selectedAddress) {
      filtered = filtered.filter((agent) => agent.ownerId === selectedAddress);
    } else {
      filtered = filtered.filter((agent) => agent.urlVerified);
    }

    if (search === "") {
      return filtered;
    }

    return filtered.filter((agent) =>
      agent.agentCard?.name?.toLowerCase().includes(search.toLowerCase()) ||
      agent.agentCard?.description?.toLowerCase().includes(search.toLowerCase()) ||
      agent.agentCard?.skills?.some((skill) => [skill.name?.toLowerCase(), skill.description?.toLowerCase(), skill.tags?.join(", ")?.toLowerCase()].some((text) => text?.includes(search.toLowerCase())))
    );
  }, [agentList, search, showMyAgentsOnly, selectedAddress]);

  const calculateTotalPages = useMemo(() => {
    if (filteredAgentList.length === 0) return 1;

    const itemsPerPage = windowWidth >= 1024 ? 8 : 4;
    return Math.ceil(filteredAgentList.length / itemsPerPage);
  }, [filteredAgentList.length, windowWidth]);

  useEffect(() => {
    setTotalPages(calculateTotalPages);
    setCurrentPage(1);
    if (swiperRef.current) {
      swiperRef.current.slideTo(0);
    }
  }, [calculateTotalPages]);

  if (endpointStatus === "connecting") {
    return (
      <div className="w-full mx-auto">
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto">
        <Card>
          <CardBody>
            <p className="text-danger">Load data failed: {error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center">
        <h2 className="text-lg mb-4 md:mb-0 flex items-center gap-2">
          Agents <Chip size="sm">{showMyAgentsOnly ? filteredAgentList.length : agentList.length}</Chip>
          {showMyAgentsOnly && selectedAddress && (
            <Chip size="sm" color="primary" variant="bordered">My Agents</Chip>
          )}
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <Input startContent={<Search className="w-4 h-4" />} placeholder="Search Agent" size="sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {selectedAddress && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-default-600">All</span>
              <Switch
                size="sm"
                isSelected={showMyAgentsOnly}
                onValueChange={setShowMyAgentsOnly}
                color="primary"
              />
              <span className="text-sm text-default-600">My</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button size="sm">
              <Link href="https://space.verisense.network" target="_blank">
                Sensespace
              </Link>
            </Button>
            <Button size="sm" color="primary">
              <Link href="/register/agent">Register Agent</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full mx-auto mt-4">
        {isLoading ? (
          <div className="w-full mx-auto">
            <Spinner />
          </div>
        ) : agentList.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-default-500 text-center">No Agent data</p>
            </CardBody>
          </Card>
        ) : (
          <>
            <Swiper
              spaceBetween={20}
              breakpoints={{
                640: {
                  slidesPerView: 1,
                },
                1024: {
                  slidesPerView: 2,
                },
              }}
              modules={[Grid, Pagination, Navigation]}
              grid={{
                rows: Math.min(4, Math.ceil(filteredAgentList.length / 2)),
              }}
              className={cn("w-full", getGridHeight(filteredAgentList.length))}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                setCurrentPage(swiper.activeIndex + 1);

                const totalSlides = swiper.slides?.length || 0;

                let actualPages = 1;
                if (swiper.snapGrid && swiper.snapGrid.length > 0) {
                  actualPages = swiper.snapGrid.length;
                } else if (totalSlides > 0) {
                  const slidesPerView = typeof swiper.params.slidesPerView === 'number' ? swiper.params.slidesPerView : (windowWidth >= 1024 ? 2 : 1);
                  actualPages = Math.ceil(totalSlides / slidesPerView);
                }

                setTotalPages(actualPages);

              }}
              onSlideChange={(swiper) => {
                setCurrentPage(swiper.activeIndex + 1);

                const totalSlides = swiper.slides?.length || 0;

                let actualPages = 1;
                if (swiper.snapGrid && swiper.snapGrid.length > 0) {
                  actualPages = swiper.snapGrid.length;
                } else if (totalSlides > 0) {
                  const slidesPerView = typeof swiper.params.slidesPerView === 'number' ? swiper.params.slidesPerView : (windowWidth >= 1024 ? 2 : 1);
                  actualPages = Math.ceil(totalSlides / slidesPerView);
                }

                setTotalPages(actualPages);
              }}
            >
              {
                filteredAgentList.map((agent) => (
                  <SwiperSlide key={`${agent.agentId}-${agent.ownerId}`} className="flex justify-center items-center">
                    <AgentCard agent={agent} showLink={true} />
                  </SwiperSlide>
                ))}
            </Swiper>
            <div className="flex items-center mt-4">
              <PaginationComponent
                total={totalPages}
                page={currentPage}
                showControls
                onChange={(page) => {
                  if (swiperRef.current) {
                    swiperRef.current.slideTo(page - 1);
                    setCurrentPage(page);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

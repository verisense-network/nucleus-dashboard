"use client";

import { Card, CardBody } from "@heroui/card";
import McpCard from "./components/McpCard";
import { Button, Chip, Pagination as PaginationComponent, Switch } from "@heroui/react";
import Link from "next/link";
import { getMcpServerList } from "@/app/actions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEndpointStore } from "@/stores/endpoint";
import { cn, Input, Spinner } from "@heroui/react";
import { wrapApiRequest } from "@/utils/api";
import { getMcpServerListAPI } from "@/api/rpc";
import { Search } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Grid, Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/grid';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { McpServer } from "@/types/mcp";
import { usePolkadotWalletStore } from "../connectWallet";

export const ListboxWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full px-1 py-2 rounded-small">{children}</div>
);

export default function McpList() {
  const { endpoint, status: endpointStatus, isLocalNode } = useEndpointStore();
  const { selectedAddress } = usePolkadotWalletStore();
  const [mcpServerList, setMcpServerList] = useState<McpServer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [showMyMcpsOnly, setShowMyMcpsOnly] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    const fetchMcpServerList = async () => {
      if (endpointStatus !== "connected") {
        return;
      }

      try {
        setIsLoading(true);
        const result = await wrapApiRequest(getMcpServerList.bind(null, endpoint), getMcpServerListAPI.bind(null, endpoint), isLocalNode(endpoint));

        if (!result.success) {
          setError(result.message || "Unknown error");
          return;
        }

        if (result.data) {
          setMcpServerList(result.data);
        }
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMcpServerList();
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

  const filteredMcpServerList = useMemo(() => {
    let filtered = mcpServerList;

    if (showMyMcpsOnly && selectedAddress) {
      filtered = filtered.filter((server) => server.provider === selectedAddress);
    } else {
      filtered = filtered.filter((server) => server.urlVerified);
    }

    if (search === "") {
      return filtered;
    }

    return filtered.filter((server) =>
      server?.name?.toLowerCase().includes(search.toLowerCase()) ||
      server?.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [mcpServerList, search, showMyMcpsOnly, selectedAddress]);

  const calculateTotalPages = useMemo(() => {
    if (filteredMcpServerList.length === 0) return 1;

    const itemsPerPage = windowWidth >= 1024 ? 8 : 4;
    return Math.ceil(filteredMcpServerList.length / itemsPerPage);
  }, [filteredMcpServerList.length, windowWidth]);

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
          MCPs <Chip size="sm">{filteredMcpServerList.length}</Chip>
          {showMyMcpsOnly && selectedAddress && (
            <Chip size="sm" color="primary" variant="bordered">My MCPs</Chip>
          )}
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <Input startContent={<Search className="w-4 h-4" />} placeholder="Search MCP" size="sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {selectedAddress && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-default-600">All</span>
              <Switch
                size="sm"
                isSelected={showMyMcpsOnly}
                onValueChange={setShowMyMcpsOnly}
                color="primary"
              />
              <span className="text-sm text-default-600">My</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button size="sm" color="primary">
              <Link href="/register/mcp">Register MCP</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full mx-auto mt-4">
        {isLoading ? (
          <div className="w-full mx-auto">
            <Spinner />
          </div>
        ) : mcpServerList.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-default-500 text-center">No MCP Server data</p>
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
                rows: Math.min(4, Math.ceil(filteredMcpServerList.length / 2)),
              }}
              className={cn("w-full", getGridHeight(filteredMcpServerList.length))}
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
                filteredMcpServerList.map((server) => (
                  <SwiperSlide key={`${server.name}-${server.url}`} className="flex justify-center items-center">
                    <McpCard mcpServer={server} showLink={true} />
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

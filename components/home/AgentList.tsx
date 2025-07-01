"use client";

import { Card, CardBody } from "@heroui/card";
import AgentCard from "./components/AgentCard";
import { Button } from "@heroui/button";
import Link from "next/link";
import { AgentInfo, getAgentList } from "@/app/actions";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEndpointStore } from "@/stores/endpoint";
import { cn, Spinner } from "@heroui/react";
import { wrapApiRequest } from "@/utils/api";
import { getAgentListAPI } from "@/api/rpc";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Grid, Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/grid';
import 'swiper/css/navigation';

export const ListboxWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full px-1 py-2 rounded-small">{children}</div>
);

export default function AgentList() {
  const { endpoint, status: endpointStatus, isLocalNode } = useEndpointStore();
  const [agentList, setAgentList] = useState<AgentInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
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
  }, [endpoint, endpointStatus]);

  const handleNavigation = useCallback((direction: "prev" | "next") => {
    if (swiperRef.current) {
      if (direction === "prev") {
        swiperRef.current.slidePrev();
      } else {
        swiperRef.current.slideNext();
      }
    }
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
      <div className="flex justify-between items-center">
        <h2 className="text-lg mb-4">Agents <span className="text-sm text-default-500">({agentList.length})</span></h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button size="sm" isIconOnly onPress={() => handleNavigation("prev")} isDisabled={isBeginning}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" isIconOnly onPress={() => handleNavigation("next")} isDisabled={isEnd}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
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
      <div className="w-full mx-auto">
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
              rows: Math.min(4, Math.ceil(agentList.length / 2)),
            }}
            className={cn("w-full", getGridHeight(agentList.length))}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
          >
            {
              agentList.map((agent) => (
                <SwiperSlide key={`${agent.agentId}-${agent.ownerId}`} className="flex justify-center items-center">
                  <AgentCard agent={agent} showLink={true} />
                </SwiperSlide>
              ))}
          </Swiper>
        )}
      </div>
    </>
  );
}

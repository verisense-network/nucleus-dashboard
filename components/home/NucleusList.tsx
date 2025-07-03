"use client";

import { getNucleusList } from "@/app/actions";
import { Card, CardBody } from "@heroui/card";
import { NucleusInfo } from "@/types/nucleus";
import NucleusCard from "./components/NucleusCard";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEndpointStore } from "@/stores/endpoint";
import { Button, Chip, cn, Input, Pagination as PaginationComponent, Spinner } from "@heroui/react";
import { wrapApiRequest } from "@/utils/api";
import { getNucleusListAPI } from "@/api/nucleus";
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Grid, Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/grid';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export const ListboxWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full px-1 py-2 rounded-small">{children}</div>
);

export default function NucleusList() {
  const { endpoint, status: endpointStatus, isLocalNode } = useEndpointStore();
  const [nucleusList, setNucleusList] = useState<NucleusInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    const fetchNucleusList = async () => {
      if (endpointStatus !== "connected") {
        return;
      }

      try {
        setIsLoading(true);
        const result = await wrapApiRequest(getNucleusList.bind(null, endpoint), getNucleusListAPI.bind(null, endpoint), isLocalNode(endpoint));

        if (!result.success) {
          setError(result.message || "Unknown error");
          return;
        }

        if (result.data) {
          setNucleusList(result.data);
        }
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNucleusList();
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
    const heights = ["min-h-[150px] h-[10vh]", "min-h-[260px] h-[15vh]", "min-h-[300px] h-[20vh]", "min-h-[400px] h-[25vh]", "min-h-[500px] h-[30vh]"];
    const thresholds = [1, 3, 5, 7, 9];

    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (length >= thresholds[i]) {
        return heights[i];
      }
    }
    return heights[0];
  };

  const filteredNucleusList = useMemo(() => {
    if (search === "") {
      return nucleusList;
    }

    return nucleusList.filter((nucleus) =>
      nucleus.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [nucleusList, search]);

  const calculateTotalPages = useMemo(() => {
    if (filteredNucleusList.length === 0) return 1;

    const itemsPerPage = windowWidth >= 1024 ? 8 : 4;
    return Math.ceil(filteredNucleusList.length / itemsPerPage);
  }, [filteredNucleusList.length, windowWidth]);

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
        <h2 className="text-lg mb-4 flex items-center gap-2">
          Nucleus <Chip size="sm">{nucleusList.length}</Chip>
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <Input startContent={<Search className="w-4 h-4" />} placeholder="Search" size="sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" isIconOnly onPress={() => handleNavigation("prev")} isDisabled={isBeginning}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" isIconOnly onPress={() => handleNavigation("next")} isDisabled={isEnd}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full mx-auto mt-4">
        {isLoading ? (
          <div className="w-full mx-auto">
            <Spinner />
          </div>
        ) : nucleusList.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-default-500 text-center">No Nucleus data</p>
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
                rows: Math.min(5, Math.ceil(filteredNucleusList.length / 2)),
              }}
              className={cn("w-full", getGridHeight(filteredNucleusList.length))}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
                setCurrentPage(swiper.activeIndex + 1);
                setTotalPages(calculateTotalPages);
              }}
              onSlideChange={(swiper) => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
                setCurrentPage(swiper.activeIndex + 1);
                setTotalPages(calculateTotalPages);
              }}
            >
              {
                filteredNucleusList.map((nucleus) => (
                  <SwiperSlide key={`${nucleus.id}-${nucleus.name}`} className="flex justify-center items-center">
                    <NucleusCard nucleus={nucleus} showLink={true} />
                  </SwiperSlide>
                ))}
            </Swiper>
            <div className="flex items-center mt-4">
              <PaginationComponent total={totalPages} page={currentPage} showControls={false} onChange={(page) => {
                if (swiperRef.current) {
                  swiperRef.current.slideTo(page - 1);
                  setCurrentPage(page);
                }
              }} />
            </div>
          </>
        )}
      </div>
    </>
  );
}

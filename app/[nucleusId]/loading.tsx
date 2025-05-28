import { Card, CardBody, CardHeader } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { Divider } from "@heroui/divider";

export default function Loading() {
  return (
    <div className="w-full mx-auto py-4 space-y-6">
      {/* 返回按钮骨架 */}
      <div className="mb-6">
        <Skeleton className="w-24 h-10 rounded-lg" />
      </div>

      {/* 页面标题骨架 */}
      <div className="mb-6 space-y-2">
        <Skeleton className="w-48 h-8 rounded-lg" />
        <Skeleton className="w-64 h-5 rounded-lg" />
      </div>

      {/* Nucleus 卡片骨架 */}
      <div className="max-w-4xl">
        <Card>
          <CardHeader className="flex justify-between items-start">
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="w-32 h-6 rounded-lg" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-48 h-4 rounded-lg" />
              </div>
            </div>
            <Skeleton className="w-24 h-6 rounded-lg" />
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="flex justify-between text-sm space-x-2" key={index}>
                  <Skeleton className="w-20 h-4 rounded-lg" />
                  <Skeleton className="w-32 h-4 rounded-lg" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 详细信息部分骨架 */}
      <div className="max-w-4xl space-y-4">
        <Skeleton className="w-24 h-6 rounded-lg" />
        
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="w-20 h-4 rounded-lg" />
                    <Skeleton className="w-full h-4 rounded-lg" />
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="w-20 h-4 rounded-lg" />
                    <Skeleton className="w-full h-4 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 
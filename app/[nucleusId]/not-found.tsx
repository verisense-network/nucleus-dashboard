import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full mx-auto py-4 space-y-6">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" startContent={<ArrowLeft size={16} />}>
            返回首页
          </Button>
        </Link>
      </div>

      {/* 404 内容 */}
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardBody className="py-12">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle size={64} className="text-warning" />
              <h1 className="text-2xl font-bold">Nucleus 未找到</h1>
              <p className="text-default-500">
                抱歉，您请求的 Nucleus 不存在或已被删除。
              </p>
              <div className="pt-4">
                <Link href="/">
                  <Button color="primary">
                    返回首页
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 
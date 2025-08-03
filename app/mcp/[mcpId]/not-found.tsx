import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full mx-auto py-4 space-y-6">
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardBody className="py-12">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle size={64} className="text-warning" />
              <h1 className="text-2xl font-bold">MCP Server not found</h1>
              <p className="text-default-500">
                Sorry, the MCP server you requested does not exist or has been removed.
              </p>
              <div className="pt-4">
                <Link href="/">
                  <Button color="primary">
                    Back to Home
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

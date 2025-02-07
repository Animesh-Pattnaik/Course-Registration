"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  course: z.string({
    required_error: "Please select a course.",
  }),
  photo: z
    .any()
    .refine((file) => file instanceof File, {
      message: "Please upload a photo.",
    })
    .refine((file) => file instanceof File && file.size <= MAX_FILE_SIZE, {
      message: "Photo must be less than 5MB.",
    })
    .refine(
      (file) => file instanceof File && ACCEPTED_IMAGE_TYPES.includes(file.type),
      {
        message: "Only .jpg, .jpeg, .png and .webp formats are supported.",
      }
    ),
});

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      course: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      console.log("Form values:", values);

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("course", values.course);
      formData.append("photo", values.photo);

      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      toast({
        title: "Success!",
        description: "Your form has been submitted successfully.",
      });

      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Course Registration</h1>
          <p className="mt-2 text-gray-600">Fill out the form below to register for a course</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="course"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="web-development">Web Development</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="mobile-development">Mobile Development</SelectItem>
                      <SelectItem value="cloud-computing">Cloud Computing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(",")}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        {...field}
                      />
                      {value && value instanceof File && (
                        <div className="text-sm text-gray-500">
                          {value.name}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
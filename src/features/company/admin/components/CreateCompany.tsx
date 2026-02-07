'use client';
import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { createcompany } from '../actions/companyactions';
import { BASE_PATH, PrevState } from '@/types/project-types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

const CreateCompany: React.FunctionComponent = () => {
  const { appData, setAppData } = useAppContext();
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [title, settitle] = React.useState('');
  const [companyDescription, setCompanyDescription] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [imageUploadResponse, setimageUploadResponse] = React.useState(null);
  const [addPrebuiltAccounts, setAddPrebuiltAccounts] = React.useState<boolean>(true);

  const initialState: PrevState = {};
  const [state, formAction, isPending] = React.useActionState(async (prevState: PrevState | null, formData: FormData) => {
    return await createcompany(prevState ?? {}, formData);
  }, initialState);

  const [businessType, setBusinessType] = React.useState<number>(0);

  React.useEffect(() => {
    if (appData.company !== null) {
      router.push(BASE_PATH + '/?page=viewcompany');
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    if (!image) return;
    const compressed = await imageCompression(image, {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
    setFile(compressed);
  };

  const uploadImage = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/images', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    }
    const data = await res.json();
    if (data) {
      setimageUploadResponse(data);
      return data;
    } else {
      setimageUploadResponse(null);
    }
  };

  React.useEffect(() => {
    if (state?.success == true) {
      toast.info(state.message || 'Company created successfully');
      setAppData((prev) => ({ ...prev, userUpdated: true }));
      router.push(BASE_PATH + '/?page=viewcompany');
    } else if (state?.success == false) {
      toast.info(
        state.message ||
        (state.errors ? Object.values(state.errors).join(', ') : null) ||
        'Cannot create company'
      );
    }
  }, [state]);

  return (
    <div className="w-full flex justify-center px-4 sm:px-6 lg:px-8">
      <div className="bg-card border border-border shadow-sm rounded-xl mt-2 p-6 sm:p-8 w-full max-w-lg">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <div className="space-y-5">
            {currentStep === 1 && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="title" className="text-lg font-semibold text-foreground">
                  You do not have any company setup, would you like to create a company?
                </Label>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="title" className="text-sm font-medium text-foreground">
                  Please enter your company name:
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => settitle(e.target.value)}
                  placeholder="Enter your company name"
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="companyDescription" className="text-sm font-medium text-foreground">
                  Please enter your company description:
                </Label>
                <Textarea
                  id="companyDescription"
                  rows={5}
                  placeholder="Enter your company description here..."
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="addPrebuiltAccounts"
                    checked={addPrebuiltAccounts}
                    onCheckedChange={(checked) => setAddPrebuiltAccounts(!!checked)}
                  />
                  <Label htmlFor="addPrebuiltAccounts" className="text-sm cursor-pointer select-none">
                    Add prebuilt accounts to my company
                  </Label>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="businessType" className="text-sm font-medium text-foreground">
                      Business Type
                    </Label>

                    <select
                      id="businessType"
                      value={businessType}
                      onChange={(e) => setBusinessType(Number(e.target.value))}
                      className="border border-border rounded-md px-3 py-2 text-sm bg-background"
                    >
                      <option value={0}>Sole Proprietorship</option>
                      <option value={1}>Partnership</option>
                      <option value={2}>Company</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="fileUpload" className="text-sm font-medium text-foreground">
                  Kindly select your company image file. You can leave it empty if you prefer.
                </Label>
                <input
                  className="border border-border rounded-md p-2 text-sm"
                  ref={inputRef}
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  onChange={handleFileChange}
                />
                {file && (
                  <p className="text-xs text-muted-foreground">Selected File: {file.name}</p>
                )}
              </div>
            )}

            {currentStep === 5 && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="" className="text-lg font-semibold text-foreground">
                  All set! You can now proceed with your company setup.
                </Label>
              </div>
            )}

            <div className="flex justify-between items-center pt-6">
              <Button
                variant="outline"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                Back
              </Button>
              <Button
                disabled={currentStep === 6}
                onClick={async () => {
                  if (currentStep === 1) setCurrentStep(2);
                  else if (currentStep === 2) setCurrentStep(3);
                  else if (currentStep === 3) setCurrentStep(4);
                  else if (currentStep === 4) setCurrentStep(5);
                  else if (currentStep === 5) {
                    setCurrentStep(6);
                    const uploadrslt = await uploadImage();
                    let avatarUrl = '';
                    if (uploadrslt && uploadrslt.id) {
                      avatarUrl = '/api/images/' + uploadrslt?.id;
                    } else {
                      avatarUrl = '/defaultavatar.svg';
                    }
                    const formData = new FormData();
                    formData.append('title', title);
                    formData.append('description', companyDescription);
                    formData.append('avatarUrl', avatarUrl);
                    formData.append('addPrebuiltAccounts', addPrebuiltAccounts ? '1' : '0');
                    formData.append('businessType', businessType.toString());
                    formData.append('currencyCode', 'USD');
                    formData.append('currencySymbol', '$');
                    formData.append('currencyName', 'US Dollar');
                    React.startTransition(() => {
                      formAction(formData);
                    });
                  }
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateCompany;

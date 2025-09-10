
import React, { useState, useMemo } from 'react';
import type { UploadedImage, GeneratedContent } from './types';
import { generateProductContent, generateMoreUsageImages, checkContentSafety, generateNewSocialMediaPost } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import GeneratedContentDisplay from './components/GeneratedContentDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import Tooltip from './components/Tooltip';

type GenerationOptions = {
  productListing: boolean;
  images: boolean;
  socialMedia: boolean;
};

const App: React.FC = () => {
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [productType, setProductType] = useState('');
  const [coreBenefit, setCoreBenefit] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingMoreImages, setIsGeneratingMoreImages] = useState(false);
  const [isGeneratingNewPost, setIsGeneratingNewPost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    productListing: true,
    images: true,
    socialMedia: true,
  });
  const [displayOptions, setDisplayOptions] = useState<GenerationOptions>({
    productListing: false,
    images: false,
    socialMedia: false,
  });

  const [activeTab, setActiveTab] = useState<'product' | 'images' | 'social'>('product');
  const [resetKey, setResetKey] = useState(0);

  const availableTabs = useMemo(() => {
    const tabs: ('product' | 'images' | 'social')[] = [];
    if (displayOptions.productListing) tabs.push('product');
    if (displayOptions.images) tabs.push('images');
    if (displayOptions.socialMedia) tabs.push('social');
    return tabs;
  }, [displayOptions]);

  const handleImageUpload = (uploadedImage: UploadedImage) => {
    setImage(uploadedImage);
  };
  
  const handleReset = () => {
    setImage(null);
    setProductType('');
    setCoreBenefit('');
    setGeneratedContent(null);
    setError(null);
    setGenerationOptions({ productListing: true, images: true, socialMedia: true });
    setDisplayOptions({ productListing: false, images: false, socialMedia: false });
    setActiveTab('product');
    setResetKey(prev => prev + 1);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setGenerationOptions(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !productType || !coreBenefit) {
      setError('Please fill out all fields and upload an image.');
      return;
    }
    if (!generationOptions.productListing && !generationOptions.images && !generationOptions.socialMedia) {
      setError('Please select at least one type of content to generate.');
      return;
    }
    
    setError(null);
    
    try {
      const isSafe = await checkContentSafety(productType, coreBenefit);
      if (!isSafe) {
        setError('The product information provided does not meet our safety guidelines. You cannot generate content for this product.');
        return;
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during the safety check. Please try again.');
      return;
    }

    setIsLoading(true);
    setGeneratedContent(null);
    
    // Determine the first tab to show
    const firstTab = generationOptions.productListing ? 'product' : generationOptions.images ? 'images' : 'social';
    setActiveTab(firstTab);

    try {
      const content = await generateProductContent(image, productType, coreBenefit, generationOptions);
      setGeneratedContent(content);
      setDisplayOptions(generationOptions); // Set display options only on success
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred. Please try again.';
      setError(errorMessage);
      setDisplayOptions({ productListing: false, images: false, socialMedia: false });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateMoreImages = async () => {
    if (!image || !productType || !coreBenefit || !generatedContent?.productTitle) return;

    setIsGeneratingMoreImages(true);
    setError(null);

    try {
        const newImages = await generateMoreUsageImages(image, generatedContent.productTitle, productType, coreBenefit);
        setGeneratedContent(prevContent => {
            if (!prevContent) return null;
            return {
                ...prevContent,
                usageImagesBase64: [...(prevContent.usageImagesBase64 || []), ...newImages],
            };
        });
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while generating more images.';
        setError(errorMessage);
    } finally {
        setIsGeneratingMoreImages(false);
    }
  };

  const handleGenerateNewSocialPost = async () => {
    if (!generatedContent || !productType || !coreBenefit) return;

    setIsGeneratingNewPost(true);
    setError(null);
    try {
      const { productTitle } = generatedContent;
      const newPost = await generateNewSocialMediaPost(productTitle || productType, productType, coreBenefit);
      setGeneratedContent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          socialMediaPost: [...(prev.socialMediaPost || []), newPost],
        };
      });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate a new social media post.';
      setError(errorMessage);
    } finally {
      setIsGeneratingNewPost(false);
    }
  };

  const isFormIncomplete = !image || !productType || !coreBenefit;

  return (
    <div className="min-h-screen bg-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
            Solopreneur Sidekick
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Your AI partner for creating amazing product content in seconds.
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    1. Product Photo
                  </label>
                  <ImageUploader key={resetKey} onImageUpload={handleImageUpload} />
                </div>

                <div>
                  <label htmlFor="product-type" className="block text-sm font-medium text-slate-700">
                    2. Product Type
                  </label>
                  <input
                    type="text"
                    id="product-type"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="e.g., e-book, Notion template, digital planner"
                    className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="core-benefit" className="block text-sm font-medium text-slate-700">
                    3. Core Feature / Benefit
                  </label>
                  <textarea
                    id="core-benefit"
                    rows={3}
                    value={coreBenefit}
                    onChange={(e) => setCoreBenefit(e.target.value)}
                    placeholder="e.g., A planner to help students track assignments."
                    className="mt-1 block w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">4. Content to Generate</label>
                    <div className="mt-2 space-y-2">
                        {Object.keys(generationOptions).map((key) => {
                            const optionKey = key as keyof GenerationOptions;
                            const labels = {
                                productListing: 'Product Listing',
                                images: 'Images',
                                socialMedia: 'Social Media Post'
                            };
                            return (
                                <div key={optionKey} className="relative flex items-start">
                                    <div className="flex h-6 items-center">
                                        <input
                                            id={optionKey}
                                            name={optionKey}
                                            type="checkbox"
                                            checked={generationOptions[optionKey]}
                                            onChange={handleCheckboxChange}
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm leading-6">
                                        <label htmlFor={optionKey} className="font-medium text-slate-900">
                                            {labels[optionKey]}
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-y-3">
                <Tooltip text="Fill out the form to generate all selected content types">
                  <button
                    type="submit"
                    disabled={isFormIncomplete || isLoading}
                    className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? 'Generating... Please Wait' : '✨ Generate Content'}
                  </button>
                </Tooltip>
                <Tooltip text="Clear all inputs and generated content">
                   <button
                      type="button"
                      onClick={handleReset}
                      disabled={isLoading}
                      className="w-full px-4 py-3 text-sm font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                      Reset
                  </button>
                </Tooltip>
              </div>
            </form>
          </div>
          
          <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col">
            {availableTabs.length > 0 && generatedContent && (
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {availableTabs.includes('product') && (
                            <button
                                onClick={() => setActiveTab('product')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                                    activeTab === 'product'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                                aria-current={activeTab === 'product' ? 'page' : undefined}
                            >
                                Product Listing
                            </button>
                        )}
                        {availableTabs.includes('images') && (
                            <button
                                onClick={() => setActiveTab('images')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                                    activeTab === 'images'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                                aria-current={activeTab === 'images' ? 'page' : undefined}
                            >
                                Images
                            </button>
                        )}
                        {availableTabs.includes('social') && (
                             <button
                                onClick={() => setActiveTab('social')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                                    activeTab === 'social'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                                aria-current={activeTab === 'social' ? 'page' : undefined}
                            >
                                Social Media
                            </button>
                        )}
                    </nav>
                </div>
            )}
             <div className="mt-4 flex-grow">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-slate-500">
                        AI is crafting your content and images...
                    </p>
                    <p className="text-sm text-slate-400">(This can take up to a minute)</p>
                  </div>
                )}
                {error && (
                  <div className="flex items-center justify-center h-full text-center text-red-600 bg-red-50 p-4 rounded-lg">
                    <p>{error}</p>
                  </div>
                )}
                {generatedContent && (
                    <GeneratedContentDisplay
                        content={generatedContent}
                        activeTab={activeTab}
                        onGenerateMore={handleGenerateMoreImages}
                        isGeneratingMore={isGeneratingMoreImages}
                        onGenerateNewSocialPost={handleGenerateNewSocialPost}
                        isGeneratingNewPost={isGeneratingNewPost}
                    />
                )}
                {!isLoading && !error && !generatedContent && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4 rounded-lg bg-slate-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="mt-4 font-medium">Your content will appear here.</p>
                        <p className="text-sm">Fill in the details on the left and let the magic happen!</p>
                    </div>
                )}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
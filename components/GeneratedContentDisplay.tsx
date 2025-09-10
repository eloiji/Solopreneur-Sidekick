
import React, { useState } from 'react';
import type { GeneratedContent } from '../types';
import CopyButton from './CopyButton';
import ImageModal from './ImageModal';
import Tooltip from './Tooltip';

interface GeneratedContentDisplayProps {
  content: GeneratedContent;
  activeTab: 'product' | 'images' | 'social';
  onGenerateMore: () => Promise<void>;
  isGeneratingMore: boolean;
  onGenerateNewSocialPost: () => Promise<void>;
  isGeneratingNewPost: boolean;
  onGenerateTaglishPost: () => Promise<void>;
  isGeneratingTaglishPost: boolean;
}

const ContentCard: React.FC<{ title: string; children: React.ReactNode; contentToCopy: string }> = ({ title, children, contentToCopy }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative">
        <div className="absolute top-3 right-3">
            <CopyButton textToCopy={contentToCopy} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">{title}</h3>
        <div className="text-slate-700 space-y-2 text-sm sm:text-base">
            {children}
        </div>
    </div>
);

const DownloadButton: React.FC<{ imageUrl: string, fileName: string }> = ({ imageUrl, fileName }) => (
    <a
      href={imageUrl}
      download={fileName}
      onClick={(e) => e.stopPropagation()} // Prevent modal from opening when downloading
      className="px-3 py-1 text-xs font-medium rounded-full flex items-center transition-all duration-200 bg-slate-200 text-slate-600 hover:bg-slate-300"
      aria-label="Download Image"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download
    </a>
);

const ImageCard: React.FC<{ title: string; imageUrl: string; altText: string; downloadFileName: string; onView: () => void; }> = ({ title, imageUrl, altText, downloadFileName, onView }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative">
        <div className="absolute top-3 right-3 z-10">
            <DownloadButton imageUrl={imageUrl} fileName={downloadFileName} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">{title}</h3>
        <div 
            onClick={onView}
            className="flex justify-center items-center bg-white p-2 rounded-md border border-slate-200 cursor-pointer group relative"
        >
             <img src={imageUrl} alt={altText} className="aspect-square w-full object-contain rounded"/>
             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
        </div>
    </div>
);

const SocialShareButtons: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=https://gemini.google.com&quote=${encodeURIComponent(text)}`;
  
    const handleCopyForInstagram = () => {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };
  
    return (
      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Share:</span>
        <Tooltip text="Share on Facebook">
          <a
            href={fbShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-600 transition-colors"
            aria-label="Share on Facebook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v2.385z" />
            </svg>
          </a>
        </Tooltip>
        <Tooltip text={copied ? "Copied to clipboard!" : "Copy post for Instagram"}>
          <button
            onClick={handleCopyForInstagram}
            className="text-slate-500 hover:text-pink-600 transition-colors disabled:text-green-600"
            aria-label="Copy post for Instagram"
            disabled={copied}
          >
            {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z" />
                </svg>
            )}
          </button>
        </Tooltip>
      </div>
    );
};

const GeneratedContentDisplay: React.FC<GeneratedContentDisplayProps> = ({ 
    content, 
    activeTab, 
    onGenerateMore, 
    isGeneratingMore,
    onGenerateNewSocialPost,
    isGeneratingNewPost,
    onGenerateTaglishPost,
    isGeneratingTaglishPost
}) => {
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const fullDescription = content.productDescription ? `${content.productDescription.hook}\n\n${content.productDescription.features.map(f => `• ${f}`).join('\n')}\n\n${content.productDescription.cta}` : '';
    const mainImageUrl = content.productImageBase64 ? `data:image/jpeg;base64,${content.productImageBase64}`: '';
    
    return (
        <div className="animate-fade-in">
            {viewingImage && <ImageModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}

            <div key={activeTab} className="animate-fade-in-fast">
                {activeTab === 'product' && content.productTitle && content.productDescription && (
                    <div className="space-y-6">
                        <ContentCard title="Product Listing Title" contentToCopy={content.productTitle}>
                            <p className="font-medium text-indigo-700 bg-indigo-50 p-3 rounded-md">{content.productTitle}</p>
                        </ContentCard>

                        <ContentCard title="Product Listing Description" contentToCopy={fullDescription}>
                            <p className="italic">"{content.productDescription.hook}"</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {content.productDescription.features.map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                ))}
                            </ul>
                            <p className="font-semibold pt-2">{content.productDescription.cta}</p>
                        </ContentCard>
                    </div>
                )}
                
                {activeTab === 'images' && content.productImageBase64 && content.usageImagesBase64 && (
                    <div className="flex flex-col h-full">
                        <div className="space-y-6 flex-grow overflow-y-auto pr-2">
                            <ImageCard 
                                title="Product Listing Image" 
                                imageUrl={mainImageUrl} 
                                altText={content.productTitle || 'Product Image'}
                                downloadFileName="product-image.jpeg"
                                onView={() => setViewingImage(mainImageUrl)}
                            />

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-800 mb-3">Usage Example Images</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {content.usageImagesBase64.map((imageBase64, index) => {
                                        const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
                                        return (
                                            <div key={index} className="relative group cursor-pointer" onClick={() => setViewingImage(imageUrl)}>
                                                <img src={imageUrl} alt={`Usage example ${index + 1}`} className="aspect-square w-full object-cover rounded-lg"/>
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-lg">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <DownloadButton imageUrl={imageUrl} fileName={`usage-image-${index + 1}.jpeg`} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap justify-center gap-4">
                            <Tooltip text="Generate 6 more unique usage example images">
                              <button
                                  onClick={onGenerateMore}
                                  disabled={isGeneratingMore}
                                  className="flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                  {isGeneratingMore ? 'Generating...' : 'Generate More Images' }
                              </button>
                            </Tooltip>
                        </div>
                    </div>
                )}

                {activeTab === 'social' && content.socialMediaPost && (
                    <div className="flex flex-col h-full">
                        <div className="space-y-6 flex-grow overflow-y-auto pr-2">
                            {content.socialMediaPost.map((post, index) => {
                                const fullSocialPost = `${post.hook}\n\n${post.body}\n\n${post.hashtags.join(' ')}`;
                                return (
                                    <ContentCard key={index} title={`Social Media Post #${index + 1}`} contentToCopy={fullSocialPost}>
                                        <p className="font-bold">{post.hook}</p>
                                        <p>{post.body}</p>
                                        <p className="text-indigo-600 font-medium pt-2">{post.hashtags.join(' ')}</p>
                                        <SocialShareButtons text={fullSocialPost} />
                                    </ContentCard>
                                );
                            })}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap justify-center gap-4">
                            <Tooltip text="Generate another engaging social media post">
                              <button
                                  onClick={onGenerateNewSocialPost}
                                  disabled={isGeneratingNewPost || isGeneratingTaglishPost}
                                  className="flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                  {isGeneratingNewPost ? 'Generating...' : 'New Post (English)'}
                              </button>
                            </Tooltip>
                             <Tooltip text="Generate a witty Taglish social media post">
                              <button
                                  onClick={onGenerateTaglishPost}
                                  disabled={isGeneratingNewPost || isGeneratingTaglishPost}
                                  className="flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                  {isGeneratingTaglishPost ? 'Generating...' : 'New Post (Taglish)'}
                              </button>
                            </Tooltip>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneratedContentDisplay;

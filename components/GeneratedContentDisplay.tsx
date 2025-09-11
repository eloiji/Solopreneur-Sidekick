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
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 relative">
        <div className="absolute top-3 right-3">
            <CopyButton textToCopy={contentToCopy} />
        </div>
        <h3 className="text-lg font-semibold text-slate-100 mb-3">{title}</h3>
        <div className="text-slate-300 space-y-2 text-sm sm:text-base">
            {children}
        </div>
    </div>
);

const DownloadButton: React.FC<{ imageUrl: string, fileName: string }> = ({ imageUrl, fileName }) => (
    <a
      href={imageUrl}
      download={fileName}
      onClick={(e) => e.stopPropagation()} // Prevent modal from opening when downloading
      className="px-3 py-1 text-xs font-medium rounded-full flex items-center transition-all duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800"
      aria-label={`Download ${fileName}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download
    </a>
);

const ImageCard: React.FC<{ title: string; imageUrl: string; altText: string; downloadFileName: string; onView: () => void; }> = ({ title, imageUrl, altText, downloadFileName, onView }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 relative">
        <div className="absolute top-3 right-3 z-10">
            <DownloadButton imageUrl={imageUrl} fileName={downloadFileName} />
        </div>
        <h3 className="text-lg font-semibold text-slate-100 mb-3">{title}</h3>
        <button 
            type="button"
            onClick={onView}
            className="w-full text-left flex justify-center items-center bg-slate-900/50 p-2 rounded-md border border-slate-700 group relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800"
            aria-label={`View larger image for ${altText}`}
        >
             <img src={imageUrl} alt={altText} className="aspect-square w-full object-contain rounded"/>
             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
        </button>
    </div>
);

interface SocialShareButtonsProps {
    text: string;
    imageBase64?: string;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ text, imageBase64 }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleWebShare = async () => {
        if (typeof navigator === 'undefined' || !navigator.share) {
            console.error("Web Share API not supported.");
            return;
        };

        const shareData: ShareData = {
            title: 'Social Media Post',
            text: text,
        };

        if (imageBase64) {
            try {
                const response = await fetch(`data:image/jpeg;base64,${imageBase64}`);
                const blob = await response.blob();
                const file = new File([blob], 'social-post.jpg', { type: 'image/jpeg' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    shareData.files = [file];
                } else {
                    console.log("This browser cannot share files, sharing text only.");
                }
            } catch (error) {
                console.error('Error converting base64 to file for sharing:', error);
            }
        }

        try {
            await navigator.share(shareData);
        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
                 console.error('Error using Web Share API:', error);
            }
        }
    };
  
    const canShare = typeof navigator !== 'undefined' && !!navigator.share;
    const imageUrl = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : '';
    const actionButtonClasses = "px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition-all duration-200 bg-slate-700 text-slate-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 disabled:bg-slate-500 disabled:cursor-not-allowed";

    return (
        <div className="mt-4 pt-4 border-t border-slate-700">
            {canShare ? (
                // Modern Share UI for supported devices (e.g., mobile)
                <div className="flex flex-col items-start gap-2">
                    <span className="text-sm font-medium text-slate-300">Share post with image:</span>
                    <button
                        onClick={handleWebShare}
                        className="w-full sm:w-auto flex justify-center items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-label="Share post using device's share options"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        Share Post
                    </button>
                </div>
            ) : (
                // Fallback UI for unsupported browsers (e.g., desktop)
                <div className="flex flex-col items-start gap-3">
                     <span className="text-sm font-medium text-slate-300">Share on desktop:</span>
                     <p className="text-xs text-slate-400 -mt-2">Download the image and copy the text to post manually.</p>
                     <div className="flex items-center gap-3 flex-wrap">
                        {imageBase64 && (
                            <a
                                href={imageUrl}
                                download="social-post.jpeg"
                                className={actionButtonClasses}
                                aria-label="Download social media image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Image
                            </a>
                        )}
                        <button
                            onClick={handleCopy}
                            className={`${actionButtonClasses} ${copied ? '!bg-green-600 !text-white' : ''}`}
                            disabled={copied}
                            aria-label={copied ? "Text copied to clipboard" : "Copy post text to clipboard"}
                        >
                            {copied ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy Text
                                </>
                            )}
                        </button>
                     </div>
                </div>
            )}
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
        <div className="animate-fade-in h-full">
            {viewingImage && <ImageModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}

            <div 
                key={activeTab} 
                id={`tabpanel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeTab}`}
                tabIndex={0}
                className="animate-fade-in-fast h-full focus:outline-none"
            >
                {activeTab === 'product' && content.productTitle && content.productDescription && (
                    <div className="space-y-6">
                        <ContentCard title="Product Listing Title" contentToCopy={content.productTitle}>
                            <p className="font-medium text-indigo-300 bg-indigo-900/50 p-3 rounded-md">{content.productTitle}</p>
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

                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                                <h3 className="text-lg font-semibold text-slate-100 mb-3">Usage Example Images</h3>
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                    {content.usageImagesBase64.map((imageBase64, index) => {
                                        const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
                                        const altText = `Usage example ${index + 1}`;
                                        return (
                                            <button type="button" key={index} className="relative group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 rounded-lg" onClick={() => setViewingImage(imageUrl)} aria-label={`View larger image for ${altText}`}>
                                                <img src={imageUrl} alt={altText} className="aspect-square w-full object-cover rounded-lg"/>
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-lg">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <DownloadButton imageUrl={imageUrl} fileName={`usage-image-${index + 1}.jpeg`} />
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-700 flex flex-wrap justify-center gap-4">
                            <Tooltip text="Generate 4 more unique usage example images">
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
                                        <div className={`flex flex-col ${post.imageBase64 ? 'sm:flex-row' : ''} gap-4`}>
                                            {post.imageBase64 && (
                                                <div className="sm:w-1/3 flex-shrink-0 relative group">
                                                    <button type="button" onClick={() => setViewingImage(`data:image/jpeg;base64,${post.imageBase64}`)} className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 rounded-lg" aria-label={`View larger image for social media post ${index + 1}`}>
                                                        <img 
                                                            src={`data:image/jpeg;base64,${post.imageBase64}`} 
                                                            alt={`Social media image for post #${index + 1}`}
                                                            className="rounded-lg w-full aspect-square object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center rounded-lg">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                            </svg>
                                                        </div>
                                                    </button>
                                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                        <DownloadButton imageUrl={`data:image/jpeg;base64,${post.imageBase64}`} fileName={`social-image-${index + 1}.jpeg`} />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex-grow">
                                                <p className="font-bold">{post.hook}</p>
                                                <p>{post.body}</p>
                                                <p className="text-indigo-400 font-medium pt-2">{post.hashtags.join(' ')}</p>
                                                <SocialShareButtons text={fullSocialPost} imageBase64={post.imageBase64} />
                                            </div>
                                        </div>
                                    </ContentCard>
                                );
                            })}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-700 flex flex-wrap justify-center gap-4">
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
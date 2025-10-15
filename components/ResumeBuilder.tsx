import React, { useState } from 'react';
import type { ResumeBuilderData, WorkExperience, Education } from '../types';
import { generateResumeFromDetails } from '../services/geminiService';

import LoadingSpinner from './LoadingSpinner';
import SparklesIcon from './icons/SparklesIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
// FIX: Import the ErrorDisplay component to resolve the 'Cannot find name' error.
import ErrorDisplay from './ErrorDisplay';

const initialFormData: ResumeBuilderData = {
  fullName: '',
  email: '',
  phoneNumber: '',
  address: '',
  summary: '',
  workExperience: [{ id: `exp_${Date.now()}`, company: '', jobTitle: '', startDate: '', endDate: '', responsibilities: '' }],
  education: [{ id: `edu_${Date.now()}`, school: '', degree: '', startDate: '', endDate: '' }],
  skills: '',
};

const ResumeBuilder: React.FC = () => {
  const [formData, setFormData] = useState<ResumeBuilderData>(initialFormData);
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section: 'workExperience' | 'education', id: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === id ? { ...item, [name]: value } : item
      ),
    }));
  };
  
  const addEntry = (section: 'workExperience' | 'education') => {
    const newEntry = section === 'workExperience'
      ? { id: `exp_${Date.now()}`, company: '', jobTitle: '', startDate: '', endDate: '', responsibilities: '' }
      : { id: `edu_${Date.now()}`, school: '', degree: '', startDate: '', endDate: '' };
    
    setFormData(prev => ({ ...prev, [section]: [...prev[section], newEntry as any] }));
  };

  const removeEntry = (section: 'workExperience' | 'education', id: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id),
    }));
  };

  const handleGenerateResume = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedResume(null);
    try {
      const result = await generateResumeFromDetails(formData);
      setGeneratedResume(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the resume.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (!generatedResume) return;
    navigator.clipboard.writeText(generatedResume).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const FormSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-cyan-400">{title}</h3>
      {children}
    </div>
  );
  
  const InputField: React.FC<{ name: string, label: string, value: string, onChange: any, placeholder?: string, isTextArea?: boolean }> = ({ name, label, value, onChange, placeholder, isTextArea = false }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      {isTextArea ? (
        <textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} rows={4} className="w-full p-2 bg-slate-800/70 text-slate-200 border border-slate-600 rounded-md focus:ring-2 focus:ring-pink-500 transition-colors" />
      ) : (
        <input type="text" id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-2 bg-slate-800/70 text-slate-200 border border-slate-600 rounded-md focus:ring-2 focus:ring-pink-500 transition-colors" />
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Column */}
      <div className="flex flex-col gap-6">
        <FormSection title="Personal Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField name="fullName" label="Full Name" value={formData.fullName} onChange={handleInputChange} />
            <InputField name="email" label="Email" value={formData.email} onChange={handleInputChange} />
            <InputField name="phoneNumber" label="Phone Number" value={formData.phoneNumber} onChange={handleInputChange} />
            <InputField name="address" label="Address" value={formData.address} onChange={handleInputChange} />
          </div>
        </FormSection>

        <FormSection title="Professional Summary">
            <InputField name="summary" label="Summary" value={formData.summary} onChange={handleInputChange} placeholder="A brief summary of your career..." isTextArea />
        </FormSection>

        <FormSection title="Work Experience">
          {formData.workExperience.map((exp, index) => (
            <div key={exp.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-700 pb-4 mb-4">
               <InputField name="jobTitle" label="Job Title" value={exp.jobTitle} onChange={(e) => handleNestedChange('workExperience', exp.id, e)} />
               <InputField name="company" label="Company" value={exp.company} onChange={(e) => handleNestedChange('workExperience', exp.id, e)} />
               <InputField name="startDate" label="Start Date" value={exp.startDate} onChange={(e) => handleNestedChange('workExperience', exp.id, e)} />
               <div className="relative">
                 <InputField name="endDate" label="End Date" value={exp.endDate} onChange={(e) => handleNestedChange('workExperience', exp.id, e)} />
                 {formData.workExperience.length > 1 && (
                    <button onClick={() => removeEntry('workExperience', exp.id)} className="absolute top-0 right-0 text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                 )}
               </div>
               <div className="md:col-span-2">
                 <InputField name="responsibilities" label="Responsibilities" value={exp.responsibilities} onChange={(e) => handleNestedChange('workExperience', exp.id, e)} isTextArea placeholder="Describe your key achievements..."/>
               </div>
            </div>
          ))}
          <button onClick={() => addEntry('workExperience')} className="flex items-center gap-2 text-cyan-400 font-semibold"><PlusIcon className="w-5 h-5"/> Add Experience</button>
        </FormSection>
        
        <FormSection title="Education">
          {formData.education.map((edu) => (
            <div key={edu.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-700 pb-4 mb-4">
               <InputField name="school" label="School / University" value={edu.school} onChange={(e) => handleNestedChange('education', edu.id, e)} />
               <InputField name="degree" label="Degree / Field of Study" value={edu.degree} onChange={(e) => handleNestedChange('education', edu.id, e)} />
               <InputField name="startDate" label="Start Date" value={edu.startDate} onChange={(e) => handleNestedChange('education', edu.id, e)} />
               <div className="relative">
                 <InputField name="endDate" label="End Date" value={edu.endDate} onChange={(e) => handleNestedChange('education', edu.id, e)} />
                 {formData.education.length > 1 && (
                    <button onClick={() => removeEntry('education', edu.id)} className="absolute top-0 right-0 text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                 )}
               </div>
            </div>
          ))}
          <button onClick={() => addEntry('education')} className="flex items-center gap-2 text-cyan-400 font-semibold"><PlusIcon className="w-5 h-5"/> Add Education</button>
        </FormSection>

        <FormSection title="Skills">
            <InputField name="skills" label="Skills" value={formData.skills} onChange={handleInputChange} placeholder="e.g., JavaScript, React, Node.js, Project Management" isTextArea />
        </FormSection>
      </div>

      {/* Output Column */}
      <div className="flex flex-col gap-6">
         <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 p-6 rounded-lg flex-grow flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-slate-200">Generated Resume</h2>
            <div className="flex-grow relative bg-slate-800/50 rounded-md p-4 min-h-[300px]">
                {isLoading && (
                   <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-lg z-10">
                      <div className="text-center">
                          <LoadingSpinner />
                          <p className="mt-2 text-lg font-semibold text-cyan-400">AI is writing your resume...</p>
                      </div>
                   </div>
                )}
                {error && <ErrorDisplay message={error} />}
                {!isLoading && !error && generatedResume && (
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans">{generatedResume}</pre>
                )}
                {!isLoading && !error && !generatedResume && (
                  <div className="flex items-center justify-center h-full text-center text-slate-400">
                    <p>Your generated resume will appear here.</p>
                  </div>
                )}
            </div>
            {generatedResume && (
                 <button 
                  onClick={handleCopyToClipboard}
                  className="mt-4 w-full bg-pink-600 text-white font-bold py-2 px-4 rounded-lg shadow-glow shadow-pink-600/50 hover:shadow-glow-lg hover:shadow-pink-600/50 transition-all duration-300 flex items-center justify-center gap-2"
                 >
                    <ClipboardIcon className="w-5 h-5" />
                    {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                 </button>
            )}
         </div>
         <button
            onClick={handleGenerateResume}
            disabled={isLoading}
            className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-glow shadow-cyan-500/50 hover:shadow-glow-lg hover:shadow-cyan-500/50 disabled:bg-slate-600 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Generating...
              </>
            ) : (
               <>
                <SparklesIcon className="w-5 h-5" />
                Generate Resume with AI
               </>
            )}
          </button>
      </div>
    </div>
  );
};

export default ResumeBuilder;
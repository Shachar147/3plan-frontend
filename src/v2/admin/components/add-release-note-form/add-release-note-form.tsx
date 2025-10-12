import React, { useContext, useRef, useState } from 'react';
import Button, { ButtonFlavor } from '../../../../components/common/button/button';
import TranslateService from '../../../../services/translate-service';
import { eventStoreContext } from '../../../../stores/events-store';
import FileUploadApiService from '../../../services/file-upload-api-service';
import ReleaseNotesApiService from '../../../services/release-notes-api-service';
import TextInput from '../../../../components/inputs/text-input/text-input';
import TextareaInput from '../../../../components/inputs/textarea-input/textarea-input';

function AddReleaseNoteForm() {
	const eventStore = useContext(eventStoreContext);
	const [isSaving, setIsSaving] = useState(false);
	const [images, setImages] = useState<File[]>([]);
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
	const uploaded = useRef(0);

	const [form, setForm] = useState({
		englishTitle: '',
		hebrewTitle: '',
		englishDescription: '',
		hebrewDescription: '',
		englishHowToUse: '',
		hebrewHowToUse: '',
	});

	const handleChange = (e: any) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const uploadedFiles = Array.from(e.target.files);
			setImages(uploadedFiles);
			setPreviewUrls(uploadedFiles.map((f) => URL.createObjectURL(f)));
		}
	};

	const uploadAllImages = async (): Promise<string[]> => {
		const uploader = new FileUploadApiService();
		const promises = images.map((file, idx) => {
			const ext = file.name.split('.').pop();
			const name = `release-notes/${Date.now()}-${idx}.${ext}`;
			return uploader.uploadPhoto(file, `/images/${name}`).then((r) => {
				uploaded.current += 1;
				return r;
			});
		});
		const results = await Promise.all(promises);
		return results.filter(Boolean).map((r: any) => r?.Location ?? r?.url ?? r);
	};

	const handleSubmit = async () => {
		if (isSaving) return;
		setIsSaving(true);
		try {
			const imageUrls = await uploadAllImages();
			const api = new ReleaseNotesApiService();
			await api.create({ ...form, imageUrls });
			alert('Saved!');
			setForm({
				englishTitle: '',
				hebrewTitle: '',
				englishDescription: '',
				hebrewDescription: '',
				englishHowToUse: '',
				hebrewHowToUse: '',
			});
			setImages([]);
			setPreviewUrls([]);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="add-poi-form-container">
			<div className="add-poi-form">
				<label>{TranslateService.translate(eventStore, 'ENGLISH')}:</label>
				<TextInput
					modalValueName="englishTitle"
					name="englishTitle"
					value={form.englishTitle}
					onChange={handleChange}
					placeholder={TranslateService.translate(eventStore, 'ENGLISH_TITLE')}
				/>
				<label>{TranslateService.translate(eventStore, 'HEBREW')}:</label>
				<TextInput
					modalValueName="hebrewTitle"
					name="hebrewTitle"
					value={form.hebrewTitle}
					onChange={handleChange}
					placeholder={TranslateService.translate(eventStore, 'HEBREW_TITLE')}
				/>

				<label>
					{TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.DESCRIPTION')} (
					{TranslateService.translate(eventStore, 'ENGLISH')})
				</label>
				<TextareaInput
					modalValueName="englishDescription"
					name="englishDescription"
					value={form.englishDescription}
					onChange={handleChange}
					placeholder={TranslateService.translate(eventStore, 'ENGLISH_DESCRIPTION')}
				/>
				<label>
					{TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.DESCRIPTION')} (
					{TranslateService.translate(eventStore, 'HEBREW')})
				</label>
				<TextareaInput
					modalValueName="hebrewDescription"
					name="hebrewDescription"
					value={form.hebrewDescription}
					onChange={handleChange}
					placeholder={TranslateService.translate(eventStore, 'HEBREW_DESCRIPTION')}
				/>

				<label>
					{TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.HOW_TO_USE')} (
					{TranslateService.translate(eventStore, 'ENGLISH')})
				</label>
				<TextareaInput
					modalValueName="englishHowToUse"
					name="englishHowToUse"
					value={form.englishHowToUse}
					onChange={handleChange}
					placeholder={TranslateService.translate(eventStore, 'ENGLISH_HOW_TO_USE')}
				/>
				<label>
					{TranslateService.translate(eventStore, 'ADMIN_MANAGE_ITEM.HOW_TO_USE')} (
					{TranslateService.translate(eventStore, 'HEBREW')})
				</label>
				<TextareaInput
					modalValueName="hebrewHowToUse"
					name="hebrewHowToUse"
					value={form.hebrewHowToUse}
					onChange={handleChange}
					placeholder={TranslateService.translate(eventStore, 'HEBREW_HOW_TO_USE')}
				/>

				<label>{TranslateService.translate(eventStore, 'MODALS.IMAGES')}</label>
				<input type="file" accept="image/*" multiple onChange={handleImageUpload} />
				<div className="flex-row gap-8">
					{previewUrls.map((url, idx) => (
						<img
							key={idx}
							src={url}
							style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6 }}
						/>
					))}
				</div>

				<Button
					isLoading={isSaving}
					flavor={ButtonFlavor.primary}
					onClick={handleSubmit}
					text={TranslateService.translate(eventStore, isSaving ? 'SAVING' : 'MODALS.SAVE')}
				/>
			</div>
		</div>
	);
}

export default AddReleaseNoteForm;

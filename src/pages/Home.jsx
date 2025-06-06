import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Home() {
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users(name, image_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const createPost = useMutation({
    mutationFn: async ({ text, imageFile }) => {
      let imageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('posts')
        .insert([{ text, image_url: imageUrl }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      setPostText('');
      setPostImage(null);
    }
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8"
        onSubmit={async (e) => {
          e.preventDefault();
          await createPost.mutateAsync({
            text: postText,
            imageFile: postImage
          });
        }}
      >
        <textarea
          className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="What's on your mind?"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          rows="3"
        />
        <div className="mt-4 flex justify-between items-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPostImage(e.target.files[0])}
            className="hidden"
            id="post-image"
          />
          <label
            htmlFor="post-image"
            className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <i className="fas fa-image mr-2" />
            Add Image
          </label>
          <button
            type="submit"
            className="btn-primary"
            disabled={!postText.trim() || createPost.isLoading}
          >
            Post
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {posts?.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center mb-4">
              <img
                src={post.author.image_url || 'https://via.placeholder.com/40'}
                alt={post.author.name}
                className="w-10 h-10 rounded-full mr-4"
              />
              <div>
                <h3 className="font-semibold">{post.author.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="text-gray-800 dark:text-gray-200 mb-4">{post.text}</p>
            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post"
                className="rounded-lg w-full"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}